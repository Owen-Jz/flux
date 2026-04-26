'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Board } from '@/models/Board';
import { Task, TaskStatus } from '@/models/Task';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { revalidatePath } from 'next/cache';
import { canCreateProject, getUpgradeMessage } from '@/lib/plan-limits';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

const SAMPLE_TASKS = [
    {
        title: 'Welcome to your board!',
        description: 'This is a sample task to get you started. You can edit or delete it anytime.',
        status: 'BACKLOG' as TaskStatus,
        priority: 'MEDIUM' as const,
    },
    {
        title: 'Invite a team member',
        description: 'Click on your workspace settings to invite teammates and collaborate together.',
        status: 'TODO' as TaskStatus,
        priority: 'HIGH' as const,
    },
    {
        title: 'Create your first real task',
        description: 'Replace this sample task with your actual work. Click the + button to add tasks.',
        status: 'IN_PROGRESS' as TaskStatus,
        priority: 'LOW' as const,
    },
];

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

    // Check plan limits
    const user = await User.findById(session.user.id).select('plan');
    const plan = (user?.plan || 'free') as 'free' | 'starter' | 'pro' | 'enterprise';
    const currentProjectCount = await Board.countDocuments({ workspaceId: workspace._id });

    if (!canCreateProject(plan, currentProjectCount)) {
        throw new Error(getUpgradeMessage(plan, 'projects'));
    }

    // Generate slug from name (consistent with workspace slug normalization)
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if board with this slug exists in this workspace
    const existing = await Board.findOne({ workspaceId: workspace._id, slug });
    if (existing) {
        throw new Error('A board with this name already exists');
    }

    const board = await Board.create({
        workspaceId: workspace._id,
        name: data.name,
        slug,
        description: data.description,
        color: data.color || '#6366f1',
    });

    // Pre-populate first board with 3 sample tasks
    const isFirstBoard = (await Board.countDocuments({ workspaceId: workspace._id })) === 1;
    if (isFirstBoard) {
        await Task.insertMany(
            SAMPLE_TASKS.map((taskData, index) => ({
                workspaceId: workspace._id,
                boardId: board._id,
                title: taskData.title,
                description: taskData.description,
                status: taskData.status,
                priority: taskData.priority,
                order: (index + 1) * 1000,
                assignees: [session.user.id],
                isSample: true,
            }))
        );
    }

    revalidatePath(`/${workspaceSlug}`);
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
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : false;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return [];
    }

    const boards = await Board.find({ workspaceId: workspace._id })
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

export async function getBoardCategories(workspaceSlug: string, boardSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Verify user is a member OR workspace allows public access
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : false;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
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
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : false;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return null;
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return null;
    }

    return {
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
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
