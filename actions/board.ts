'use server';

import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Board } from '@/models/Board';
import { Task, TaskStatus } from '@/models/Task';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';
import { canCreateProject, getUpgradeMessage } from '@/lib/plan-limits';
import { resolveWorkspacePlan } from '@/lib/workspace-plan';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { canAccessBoard, canGuestAccessBoard, boardVisibilityFilter } from '@/lib/board-access';
import type { BoardVisibility } from '@/models/Board';
import { emitEvent } from '@/lib/webhook-emitter';
import { trackEvent } from '@/lib/track';

interface CreateBoardData {
    name: string;
    description?: string;
    color?: string;
}

export async function createBoard(workspaceSlug: string, data: CreateBoardData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check membership and role
    const member = isWorkspaceMember(workspace, session.user.id);
    // Only ADMIN and EDITOR can create boards
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to create boards');
    }

    // Check plan limits — governed by the workspace OWNER's plan, not the actor's.
    const plan = await resolveWorkspacePlan(workspace.ownerId);
    const currentProjectCount = await Board.countDocuments({ workspaceId: workspace._id });

    if (!canCreateProject(plan, currentProjectCount)) {
        throw new Error(getUpgradeMessage(plan, 'projects'));
    }

    // Generate a unique slug — append -2, -3 … on collision
    const baseSlug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let resolvedSlug = baseSlug;
    for (let attempt = 2; attempt <= 10; attempt++) {
        const collision = await Board.findOne({ workspaceId: workspace._id, slug: resolvedSlug });
        if (!collision) break;
        resolvedSlug = `${baseSlug}-${attempt}`;
        if (attempt === 10) throw new Error('Could not generate a unique board slug. Please choose a different name.');
    }

    const board = await Board.create({
        workspaceId: workspace._id,
        name: data.name,
        slug: resolvedSlug,
        description: data.description,
        color: data.color || '#6366f1',
    });

    revalidatePath(`/${workspaceSlug}`);
    // Emit webhook for board created
    emitEvent(
        session.user.id,
        'board.created',
        workspace._id.toString(),
        { boardId: board._id.toString(), workspaceId: workspace._id.toString(), name: board.name, slug: board.slug, color: board.color }
    ).catch(console.error);
    // First-party funnel: board created.
    after(() =>
        trackEvent({
            event: 'board_created',
            userId: session.user.id,
            workspaceId: workspace._id.toString(),
        })
    );
    return {
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
    };
}

export async function getBoards(workspaceSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Verify user is a member OR workspace allows public access
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return [];
    }

    // Restrict to boards this user (or guest) may see.
    const boards = await Board.find({
        workspaceId: workspace._id,
        ...boardVisibilityFilter(session?.user?.id, member),
    })
        .sort({ createdAt: 1 })
        .lean();

    return boards.map((board) => ({
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
    }));
}

export interface BoardTaskStat {
    total: number;
    done: number;
    inProgress: number;
}

/**
 * Per-board task rollup for a workspace, keyed by board id (string).
 * Read-only and page-scoped — deliberately separate from getBoards() so the
 * sidebar/layout path is not burdened with a tasks aggregation on every load.
 * ARCHIVED tasks are excluded from totals.
 */
export async function getBoardTaskStats(
    workspaceSlug: string
): Promise<Record<string, BoardTaskStat>> {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug }).select('_id settings members');
    if (!workspace) {
        return {};
    }

    // Mirror getBoards() access rules: members or publicly-accessible workspaces only.
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;
    if (!member && !hasPublicAccess) {
        return {};
    }

    // Restrict the rollup to boards the caller can actually see. Without this,
    // a RESTRICTED board's task counts leak into the workspace stat tiles and
    // into the serialized client payload (boardStats is passed to a 'use client'
    // grid), defeating board-level visibility.
    const visibleBoards = await Board.find({
        workspaceId: workspace._id,
        ...boardVisibilityFilter(session?.user?.id, member),
    }).select('_id').lean();
    if (visibleBoards.length === 0) {
        return {};
    }
    const visibleBoardIds = visibleBoards.map((b) => b._id);

    const rows = await Task.aggregate<{ _id: Types.ObjectId; total: number; done: number; inProgress: number }>([
        { $match: { workspaceId: workspace._id, boardId: { $in: visibleBoardIds }, status: { $ne: 'ARCHIVED' } } },
        {
            $group: {
                _id: '$boardId',
                total: { $sum: 1 },
                done: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            },
        },
    ]);

    const stats: Record<string, BoardTaskStat> = {};
    for (const row of rows) {
        stats[row._id.toString()] = {
            total: row.total,
            done: row.done,
            inProgress: row.inProgress,
        };
    }
    return stats;
}

export async function getBoardCategories(workspaceSlug: string, boardSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Verify user is a member OR workspace allows public access
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return [];
    }

    // Enforce board-level visibility.
    const allowed = member
        ? canAccessBoard(board, session?.user?.id, member)
        : canGuestAccessBoard(board);
    if (!allowed) {
        return [];
    }

    return (board.categories || []).map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        color: c.color,
    }));
}

export async function getBoardBySlug(workspaceSlug: string, boardSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return null;
    }

    // Verify user is a member OR workspace allows public access
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return null;
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return null;
    }

    // Enforce board-level visibility — a restricted board 404s for users without access.
    const allowed = member
        ? canAccessBoard(board, session?.user?.id, member)
        : canGuestAccessBoard(board);
    if (!allowed) {
        return null;
    }

    return {
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
        visibility: board.visibility,
        categories: (board.categories || []).map((c: any) => ({
            id: c._id.toString(),
            name: c.name,
            color: c.color,
        })),
    };
}

export async function updateBoard(
    workspaceSlug: string,
    boardSlug: string,
    data: { name?: string; description?: string; color?: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN and EDITOR can update boards
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to update boards');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (data.name !== undefined) board.name = data.name;
    if (data.description !== undefined) board.description = data.description;
    if (data.color !== undefined) board.color = data.color;

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function deleteBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN can delete boards
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        throw new Error('Only the workspace admin can delete boards');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    // Delete all tasks associated with this board
    await Task.deleteMany({ boardId: board._id });

    await Board.findByIdAndDelete(board._id);

    // Emit webhook for board deleted
    emitEvent(
        session.user.id,
        'board.deleted',
        workspace._id.toString(),
        { boardId: board._id.toString(), workspaceId: workspace._id.toString(), name: board.name }
    ).catch(console.error);

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function addCategory(
    workspaceSlug: string,
    boardSlug: string,
    data: { name: string; color: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN and EDITOR can manage categories
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        board.categories = [];
    }

    board.categories.push({
        _id: new Types.ObjectId(),
        name: data.name,
        color: data.color,
    });

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    const newCategory = board.categories[board.categories.length - 1];
    return { id: newCategory._id.toString(), name: newCategory.name, color: newCategory.color };
}

export async function deleteCategory(workspaceSlug: string, boardSlug: string, categoryId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        board.categories = [];
    }
    board.categories = board.categories.filter((c: any) => c._id.toString() !== categoryId);
    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function updateCategory(
    workspaceSlug: string,
    boardSlug: string,
    categoryId: string,
    data: { name?: string; color?: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        throw new Error('Category not found');
    }

    const category = board.categories.find((c: any) => c._id.toString() === categoryId);
    if (!category) {
        throw new Error('Category not found');
    }

    if (data.name) category.name = data.name;
    if (data.color) category.color = data.color;

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

/**
 * Read a board's access configuration. ADMIN-only — this is a management surface,
 * not something regular members need to see.
 */
export async function getBoardAccess(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        throw new Error('Only the workspace admin can manage board access');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    return {
        visibility: board.visibility as BoardVisibility,
        memberIds: (board.memberIds || []).map((id) => id.toString()),
    };
}

/**
 * Update a board's access configuration. ADMIN-only.
 *
 * - WORKSPACE  → board is open to all members; the member list is cleared.
 * - RESTRICTED → board is limited to the supplied member list (admins always retain
 *                access regardless). Only genuine workspace members can be granted access.
 */
export async function updateBoardAccess(
    workspaceSlug: string,
    boardSlug: string,
    data: { visibility: BoardVisibility; memberIds: string[] }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    if (data.visibility !== 'WORKSPACE' && data.visibility !== 'RESTRICTED') {
        throw new Error('Invalid visibility value');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        throw new Error('Only the workspace admin can manage board access');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (data.visibility === 'RESTRICTED') {
        // Only ids that are actually workspace members may be granted access.
        const workspaceMemberIds = new Set(
            workspace.members.map((m: { userId: { toString: () => string } }) => m.userId.toString())
        );
        const validIds = Array.from(new Set(data.memberIds)).filter((id) => workspaceMemberIds.has(id));

        board.visibility = 'RESTRICTED';
        board.memberIds = validIds.map((id) => new Types.ObjectId(id));
    } else {
        board.visibility = 'WORKSPACE';
        board.memberIds = [];
    }

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);

    return {
        success: true,
        visibility: board.visibility as BoardVisibility,
        memberIds: board.memberIds.map((id) => id.toString()),
    };
}
