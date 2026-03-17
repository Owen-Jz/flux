'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
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

async function logAction(action: string, targetType: 'user' | 'workspace' | 'task', targetId: string, details: Record<string, unknown> = {}) {
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
 * Get all users with pagination and search
 */
export async function getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    sortBy?: 'createdAt' | 'name' | 'email';
    sortOrder?: 'asc' | 'desc';
} = {}) {
    const { page = 1, limit = 20, search, plan, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    await connectDB();

    const query: Record<string, unknown> = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    if (plan) {
        query.plan = plan;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    return {
        users: users.map(u => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            image: u.image,
            plan: u.plan,
            subscriptionStatus: u.subscriptionStatus,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        })),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    };
}

/**
 * Get detailed user information
 */
export async function getUserDetails(userId: string) {
    await connectDB();

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
        throw new Error('User not found');
    }

    // Get user's workspaces
    const workspaces = await Workspace.find({ 'members.userId': new Types.ObjectId(userId) })
        .select('name slug ownerId members createdAt')
        .lean();

    const workspaceDetails = await Promise.all(
        workspaces.map(async (ws) => {
            const taskCount = await Task.countDocuments({
                workspaceId: ws._id,
                assignees: new Types.ObjectId(userId),
            });

            const member = ws.members.find((m: unknown) => (m as { userId: { toString: () => string } }).userId.toString() === userId);

            return {
                id: ws._id.toString(),
                name: ws.name,
                slug: ws.slug,
                role: (member as { role?: string })?.role || 'VIEWER',
                taskCount,
                createdAt: ws.createdAt,
                isOwner: ws.ownerId?.toString() === userId,
            };
        })
    );

    // Get workspace counts
    const ownedWorkspaces = workspaces.filter((ws) => ws.ownerId?.toString() === userId).length;
    const memberWorkspaces = workspaces.length - ownedWorkspaces;

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        createdAt: user.createdAt,
        workspaces: workspaceDetails,
        stats: {
            ownedWorkspaces,
            memberWorkspaces,
            totalWorkspaces: workspaces.length,
        },
    };
}

/**
 * Suspend a user
 */
export async function suspendUser(userId: string, reason?: string) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.users && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                suspended: true,
                suspensionReason: reason,
                suspendedAt: new Date(),
                suspendedBy: adminId,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new Error('User not found');
    }

    await logAction('SUSPEND_USER', 'user', userId, { reason: reason || 'No reason provided' });
    revalidatePath('/admin/users');

    return { success: true, userId };
}

/**
 * Unsuspend a user
 */
export async function unsuspendUser(userId: string) {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.users && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                suspended: 1,
                suspensionReason: 1,
                suspendedAt: 1,
                suspendedBy: 1,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new Error('User not found');
    }

    await logAction('UNSUSPEND_USER', 'user', userId, {});
    revalidatePath('/admin/users');

    return { success: true, userId };
}

/**
 * Update user's plan
 */
export async function updateUserPlan(userId: string, plan: 'free' | 'starter' | 'pro' | 'enterprise') {
    await connectDB();

    // Check permissions
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (!admin?.permissions.billing && admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Permission denied');
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { plan },
        { new: true }
    );

    if (!user) {
        throw new Error('User not found');
    }

    await logAction('UPDATE_USER_PLAN', 'user', userId, { newPlan: plan });
    revalidatePath('/admin/users');

    return { success: true, userId, plan };
}

/**
 * Delete a user (permanent)
 */
export async function deleteUser(userId: string) {
    await connectDB();

    // Only super admins can delete users
    const adminId = await getCurrentAdminId();
    const admin = await Admin.findById(adminId);
    if (admin?.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can delete users');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Delete user's workspaces (owned)
    await Workspace.deleteMany({ ownerId: new Types.ObjectId(userId) });

    // Remove from other workspaces
    await Workspace.updateMany(
        { 'members.userId': new Types.ObjectId(userId) },
        { $pull: { members: { userId: new Types.ObjectId(userId) } } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    await logAction('DELETE_USER', 'user', userId, {
        deletedUserEmail: user.email,
    });
    revalidatePath('/admin/users');

    return { success: true };
}
