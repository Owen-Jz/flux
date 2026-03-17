'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Admin, AdminRole } from '@/models/Admin';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

/**
 * Log an admin action to the audit log
 */
async function logAdminAction(
    adminId: string,
    action: string,
    targetType: 'user' | 'workspace' | 'task' | 'board' | 'admin',
    targetId: string,
    details: Record<string, unknown> = {}
) {
    await connectDB();

    await AuditLog.create({
        adminId: new Types.ObjectId(adminId),
        action,
        targetType,
        targetId: new Types.ObjectId(targetId),
        details,
    });
}

/**
 * Create a new admin (super admin only)
 */
export async function createAdmin(userId: string, role: AdminRole = 'SUPPORT_ADMIN') {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // Check if requester is super admin
    const currentAdmin = await Admin.findOne({ userId: session.user.id });
    if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can create other admins');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if already an admin
    const existingAdmin = await Admin.findOne({ userId: new Types.ObjectId(userId) });
    if (existingAdmin) {
        throw new Error('User is already an admin');
    }

    // Create admin
    const admin = await Admin.create({
        userId: new Types.ObjectId(userId),
        role,
        permissions: {
            users: role === 'SUPER_ADMIN' || role === 'SUPPORT_ADMIN',
            workspaces: role === 'SUPER_ADMIN' || role === 'SUPPORT_ADMIN',
            analytics: role === 'SUPER_ADMIN' || role === 'ANALYTICS_ADMIN',
            settings: role === 'SUPER_ADMIN',
            billing: role === 'SUPER_ADMIN',
        },
    });

    // Log action
    await logAdminAction(currentAdmin._id.toString(), 'CREATE_ADMIN', 'admin', admin._id.toString(), {
        newAdminRole: role,
        targetUserId: userId,
    });

    revalidatePath('/admin');
    return { success: true, adminId: admin._id.toString() };
}

/**
 * Remove admin access from a user
 */
export async function removeAdmin(adminId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // Check if requester is super admin
    const currentAdmin = await Admin.findOne({ userId: session.user.id });
    if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can remove admin access');
    }

    // Cannot remove yourself
    if (adminId === currentAdmin._id.toString()) {
        throw new Error('Cannot remove your own admin access');
    }

    // Find and remove admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
        throw new Error('Admin not found');
    }

    const userId = admin.userId.toString();
    await Admin.findByIdAndDelete(adminId);

    // Log action
    await logAdminAction(currentAdmin._id.toString(), 'REMOVE_ADMIN', 'admin', adminId, {
        removedAdminUserId: userId,
    });

    revalidatePath('/admin');
    return { success: true };
}

/**
 * Update admin role
 */
export async function updateAdminRole(adminId: string, newRole: AdminRole) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // Check if requester is super admin
    const currentAdmin = await Admin.findOne({ userId: session.user.id });
    if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can update admin roles');
    }

    // Cannot change your own role
    if (adminId === currentAdmin._id.toString()) {
        throw new Error('Cannot change your own role');
    }

    const admin = await Admin.findByIdAndUpdate(
        adminId,
        {
            role: newRole,
            permissions: {
                users: newRole === 'SUPER_ADMIN' || newRole === 'SUPPORT_ADMIN',
                workspaces: newRole === 'SUPER_ADMIN' || newRole === 'SUPPORT_ADMIN',
                analytics: newRole === 'SUPER_ADMIN' || newRole === 'ANALYTICS_ADMIN',
                settings: newRole === 'SUPER_ADMIN',
                billing: newRole === 'SUPER_ADMIN',
            },
        },
        { new: true }
    );

    if (!admin) {
        throw new Error('Admin not found');
    }

    // Log action
    await logAdminAction(currentAdmin._id.toString(), 'UPDATE_ADMIN_ROLE', 'admin', adminId, {
        newRole,
    });

    revalidatePath('/admin');
    return { success: true };
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
    options: {
        adminId?: string;
        action?: string;
        targetType?: string;
        limit?: number;
        page?: number;
    } = {}
) {
    const { adminId, action, targetType, limit = 50, page = 1 } = options;

    await connectDB();

    const query: Record<string, unknown> = {};

    if (adminId) query.adminId = new Types.ObjectId(adminId);
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .populate('adminId', 'userId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AuditLog.countDocuments(query),
    ]);

    return {
        logs: logs.map(log => ({
            id: log._id.toString(),
            adminId: (log.adminId as unknown as { userId: { _id: string } })?.userId?._id?.toString(),
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId.toString(),
            details: log.details,
            createdAt: log.createdAt,
        })),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    };
}
