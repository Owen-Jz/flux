'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

async function getCurrentAdminId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const admin = await Admin.findOne({ userId: session.user.id });
    if (!admin) {
        throw new Error('Admin access required');
    }

    return admin._id.toString();
}

async function logAction(action: string, targetType: 'user' | 'workspace' | 'task' | 'board', targetId: string, details: Record<string, unknown> = {}) {
    const adminId = await getCurrentAdminId();
    await AuditLog.create({
        adminId: new Types.ObjectId(adminId),
        action,
        targetType,
        targetId: new Types.ObjectId(targetId),
        details,
    });
}

/**
 * Get all workspaces with pagination and search
 */
export async function getAllWorkspaces(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'memberCount';
    sortOrder?: 'asc' | 'desc';
} = {}) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    await connectDB();

    const query: Record<string, unknown> = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;

    // Aggregate to get member count
    const workspaces = await Workspace.aggregate([
        { $match: query },
        {
            $addFields: {
                memberCount: { $size: '$members' },
            },
        },
        { $sort: { [sortBy === 'memberCount' ? 'memberCount' : sortBy]: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit },
    ]);

    const total = await Workspace.countDocuments(query);

    // Populate owner details
    const workspaceIds = workspaces.map((ws) => ws._id);
    const workspacesWithOwner = await Workspace.find({ _id: { $in: workspaceIds } })
        .populate('ownerId', 'name email image')
        .lean();

    const ownerMap = new Map(workspacesWithOwner.map((ws) => [ws._id.toString(), ws.ownerId]));

    return {
        workspaces: workspaces.map((ws) => ({
            id: ws._id.toString(),
            name: ws.name,
            slug: ws.slug,
            accentColor: ws.accentColor,
            publicAccess: ws.publicAccess,
            memberCount: ws.memberCount,
            createdAt: ws.createdAt,
            owner: ownerMap.get(ws._id.toString()) ? {
                id: (ownerMap.get(ws._id.toString()) as { _id: { toString: () => string } })?._id?.toString(),
                name: (ownerMap.get(ws._id.toString()) as { name?: string })?.name,
                email: (ownerMap.get(ws._id.toString()) as { email?: string })?.email,
            } : null,
        })),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    };
}

/**
 * Get detailed workspace information
 */
export async function getWorkspaceDetails(workspaceId: string) {
    await connectDB();

    const workspace = await Workspace.findById(workspaceId)
        .populate('ownerId', 'name email image')
        .lean();

    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Get boards
    const boards = await Board.find({ workspaceId: workspace._id })
        .select('name slug color createdAt')
        .lean();

    // Get task stats
    const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ workspaceId: workspace._id }),
        Task.countDocuments({ workspaceId: workspace._id, status: 'DONE' }),
    ]);

    // Get member details
    const memberIds = workspace.members.map((m: unknown) => (m as { userId: Types.ObjectId }).userId);
    const members = await User.find({ _id: { $in: memberIds } })
        .select('name email image')
        .lean();

    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));

    return {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        accentColor: workspace.settings?.accentColor || '#7c3aed',
        publicAccess: workspace.settings?.publicAccess ?? false,
        createdAt: workspace.createdAt,
        owner: workspace.ownerId ? {
            id: (workspace.ownerId as { _id: Types.ObjectId })._id.toString(),
            name: (workspace.ownerId as { name?: string }).name,
            email: (workspace.ownerId as { email?: string }).email,
            image: (workspace.ownerId as { image?: string }).image,
        } : null,
        members: workspace.members.map((m: unknown) => {
            const member = m as { userId: Types.ObjectId; role: string; joinedAt: Date };
            const user = memberMap.get(member.userId.toString());
            return {
                userId: member.userId.toString(),
                role: member.role,
                joinedAt: member.joinedAt,
                name: user?.name,
                email: user?.email,
                image: user?.image,
            };
        }),
        boards: boards.map((b) => ({
            id: b._id.toString(),
            name: b.name,
            slug: b.slug,
            color: b.color,
            createdAt: b.createdAt,
        })),
        stats: {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            boardCount: boards.length,
            memberCount: workspace.members.length,
        },
    };
}

/**
 * Archive a workspace (soft delete)
 */
export async function archiveWorkspace(workspaceId: string) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.workspaces && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        { $set: { archived: true, archivedAt: new Date(), archivedBy: adminId } },
        { new: true }
    );

    if (!workspace) {
        throw new Error('Workspace not found');
    }

    await logAction('ARCHIVE_WORKSPACE', 'workspace', workspaceId, {});
    revalidatePath('/admin/workspaces');
}

/**
 * Unarchive a workspace
 */
export async function unarchiveWorkspace(workspaceId: string) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.workspaces && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        { $unset: { archived: 1, archivedAt: 1, archivedBy: 1 } },
        { new: true }
    );

    if (!workspace) {
        throw new Error('Workspace not found');
    }

    await logAction('UNARCHIVE_WORKSPACE', 'workspace', workspaceId, {});
    revalidatePath('/admin/workspaces');

    return { success: true, workspaceId };
}

/**
 * Delete a workspace (permanent)
 */
export async function deleteWorkspace(workspaceId: string) {
    await connectDB();

    // Only super admins can delete workspaces
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can delete workspaces');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Delete boards
    await Board.deleteMany({ workspaceId: workspace._id });

    // Delete tasks
    await Task.deleteMany({ workspaceId: workspace._id });

    // Delete workspace
    await Workspace.findByIdAndDelete(workspaceId);

    await logAction('DELETE_WORKSPACE', 'workspace', workspaceId, {
        deletedWorkspaceName: workspace.name,
    });
    revalidatePath('/admin/workspaces');
}

/**
 * Transfer workspace ownership
 */
export async function transferWorkspaceOwnership(workspaceId: string, newOwnerId: string) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.workspaces && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
        throw new Error('New owner user not found');
    }

    // Check if new owner is a member
    const isMember = workspace.members.some(
        (m: unknown) => (m as { userId: { toString: () => string } }).userId.toString() === newOwnerId
    );

    if (!isMember) {
        throw new Error('New owner must be a workspace member');
    }

    // Update owner
    workspace.ownerId = new Types.ObjectId(newOwnerId);
    await workspace.save();

    await logAction('TRANSFER_WORKSPACE_OWNERSHIP', 'workspace', workspaceId, {
        newOwnerId,
    });
    revalidatePath('/admin/workspaces');

    return { success: true };
}

/**
 * Toggle public access
 */
export async function toggleWorkspacePublicAccess(workspaceId: string, publicAccess: boolean) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.workspaces && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        { 'settings.publicAccess': publicAccess },
        { new: true }
    );

    if (!workspace) {
        throw new Error('Workspace not found');
    }

    await logAction('TOGGLE_WORKSPACE_PUBLIC', 'workspace', workspaceId, { publicAccess });
    revalidatePath('/admin/workspaces');
}
