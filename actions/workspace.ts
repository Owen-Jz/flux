'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { ActivityLog } from '@/models/ActivityLog';
import { User } from '@/models/User';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

export async function createWorkspace(data: { name: string; slug: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // Check if slug is taken
    const existing = await Workspace.findOne({ slug: data.slug });
    if (existing) {
        throw new Error('Workspace slug already taken');
    }

    const workspace = await Workspace.create({
        name: data.name,
        slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
        ownerId: session.user.id,
        inviteCode: nanoid(10),
        settings: {
            publicAccess: false,
        },
        members: [
            {
                userId: session.user.id,
                role: 'ADMIN',
                joinedAt: new Date(),
            },
        ],
    });

    revalidatePath('/dashboard');
    return { slug: workspace.slug };
}

export async function getWorkspaces() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspaces = await Workspace.find({
        'members.userId': session.user.id,
    })
        .select('name slug settings updatedAt members')
        .lean();

    // Get board counts and most recent activity per workspace
    const workspaceIds = workspaces.map((w) => w._id);
    const boards = await Board.find({
        workspaceId: { $in: workspaceIds },
    })
        .select('workspaceId updatedAt')
        .lean();

    // Aggregate board stats per workspace
    const boardStats = boards.reduce(
        (acc, board) => {
            const wid = board.workspaceId.toString();
            if (!acc[wid]) {
                acc[wid] = { count: 0, lastActive: new Date(0) };
            }
            acc[wid].count += 1;
            if (board.updatedAt > acc[wid].lastActive) {
                acc[wid].lastActive = board.updatedAt;
            }
            return acc;
        },
        {} as Record<string, { count: number; lastActive: Date }>
    );

    return workspaces
        .map((w) => {
            const wid = w._id.toString();
            const stats = boardStats[wid] || { count: 0, lastActive: w.updatedAt };
            return {
                id: wid,
                name: w.name,
                slug: w.slug,
                publicAccess: w.settings?.publicAccess || false,
                accentColor: w.settings?.accentColor,
                icon: w.settings?.icon,
                memberCount: w.members.length,
                boardCount: stats.count,
                lastActiveAt: stats.lastActive,
            };
        })
        .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
}

export async function getWorkspaceUnreadCounts(workspaceSlugs: string[]) {
    const session = await auth();
    if (!session?.user?.id || workspaceSlugs.length === 0) {
        return {};
    }

    await connectDB();

    const workspaces = await Workspace.find({
        slug: { $in: workspaceSlugs },
        'members.userId': session.user.id,
    }).select('_id slug').lean();

    if (workspaces.length === 0) return {};

    const workspaceIds = workspaces.map(w => w._id);
    const unreadCounts = await ActivityLog.aggregate([
        {
            $match: {
                workspaceId: { $in: workspaceIds },
                read: false,
            },
        },
        {
            $group: {
                _id: '$workspaceId',
                count: { $sum: 1 },
            },
        },
    ]);

    const slugToCount: Record<string, number> = {};
    unreadCounts.forEach(entry => {
        const ws = workspaces.find(w => w._id.toString() === entry._id.toString());
        if (ws) slugToCount[ws.slug] = entry.count;
    });

    return slugToCount;
}

export async function getWorkspaceBySlug(slug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug })
        .populate('members.userId', 'name email image')
        .lean();

    if (!workspace) {
        return null;
    }

    return {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId.toString(),
        publicAccess: workspace.settings?.publicAccess || false,
        accentColor: workspace.settings?.accentColor,
        icon: workspace.settings?.icon,
        members: workspace.members.map((m: {
            userId: { _id: { toString: () => string }; name: string; email: string; image?: string } | { toString: () => string };
            role: string;
        }) => ({
            userId: typeof m.userId === 'object' && '_id' in m.userId ? m.userId._id.toString() : m.userId.toString(),
            role: m.role,
            user: typeof m.userId === 'object' && 'name' in m.userId ? {
                name: m.userId.name,
                email: m.userId.email,
                image: m.userId.image,
            } : null,
        })),
        inviteCode: workspace.inviteCode,
    };
}

export async function updateWorkspaceSettings(
    slug: string,
    settings: { publicAccess?: boolean; accentColor?: string; icon?: { type: 'upload' | 'emoji'; url?: string; emoji?: string } | null }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // First verify user is admin
    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Ensure settings object exists
    if (!workspace.settings) {
        workspace.settings = { publicAccess: false };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        throw new Error('Only the workspace admin can modify settings');
    }

    // Build update object
    const updateFields: Record<string, unknown> = {};

    if (settings.publicAccess !== undefined) {
        updateFields['settings.publicAccess'] = settings.publicAccess;
    }
    if (settings.accentColor !== undefined) {
        updateFields['settings.accentColor'] = settings.accentColor;
    }
    if (settings.icon !== undefined) {
        if (settings.icon === null) {
            updateFields['settings.icon'] = undefined;
        } else {
            // Build the complete icon object to avoid partial subdocument updates
            updateFields['settings.icon'] = {
                type: settings.icon.type,
                url: settings.icon.url ?? null,
                emoji: settings.icon.emoji ?? null,
            };
        }
    }

    await Workspace.findOneAndUpdate(
        { slug },
        { $set: updateFields },
        { new: true }
    );

    revalidatePath(`/${slug}`);

    return { success: true };
}

export async function addViewerToWorkspace(slug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if already a member
    const member = isWorkspaceMember(workspace, session.user.id);

    if (member) {
        return { success: true };
    }

    // Add as viewer
    workspace.members.push({
        userId: new Types.ObjectId(session.user.id),
        role: 'VIEWER',
        joinedAt: new Date(),
    });

    await workspace.save();
    revalidatePath(`/${slug}`);

    return { success: true };
}

export async function updateMemberRole(slug: string, memberId: string, newRole: 'EDITOR' | 'VIEWER') {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if requester is OWNER
    const requester = isWorkspaceMember(workspace, session.user.id);

    if (!hasRole(requester, 'ADMIN')) {
        throw new Error('Only the workspace admin can update member roles');
    }

    // Find the member to update
    const memberIndex = workspace.members.findIndex(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === memberId
    );

    if (memberIndex === -1) {
        throw new Error('Member not found');
    }

    // Prevent changing owner's role
    if (workspace.members[memberIndex].userId.toString() === workspace.ownerId.toString()) {
        throw new Error('Cannot change owner role');
    }

    workspace.members[memberIndex].role = newRole;
    await workspace.save();
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/team`);

    return { success: true };
}

export async function removeMember(slug: string, memberId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if requester is OWNER
    const requester = isWorkspaceMember(workspace, session.user.id);

    if (!hasRole(requester, 'ADMIN')) {
        throw new Error('Only the workspace admin can remove members');
    }

    // Prevent removing owner
    if (memberId === workspace.ownerId.toString()) {
        throw new Error('Cannot remove workspace owner');
    }

    workspace.members = workspace.members.filter(
        (m: { userId: { toString: () => string } }) => m.userId.toString() !== memberId
    );

    await workspace.save();

    // Remove member from all task assignments in this workspace
    await Task.updateMany(
        { workspaceId: workspace._id, assignees: memberId },
        { $pull: { assignees: memberId } }
    );

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/team`);

    return { success: true };
}
