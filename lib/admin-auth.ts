import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Admin, AdminRole } from '@/models/Admin';
import { User } from '@/models/User';
import { Types } from 'mongoose';

export interface AdminUser {
    id: string;
    userId: string;
    role: AdminRole;
    permissions: {
        users: boolean;
        workspaces: boolean;
        analytics: boolean;
        settings: boolean;
        billing: boolean;
    };
    lastLogin?: Date;
    user?: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

/**
 * Get the current admin user from the session
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    // Check for env-based admin credentials login
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && session.user.email === adminEmail && session.user.id === 'admin-session') {
        return {
            id: 'env-admin',
            userId: 'admin-session',
            role: 'SUPER_ADMIN',
            permissions: {
                users: true,
                workspaces: true,
                analytics: true,
                settings: true,
                billing: true,
            },
            user: {
                name: 'Admin',
                email: adminEmail,
                image: null,
            },
        };
    }

    await connectDB();

    const admin = await Admin.findOne({ userId: session.user.id }).populate('userId', 'name email image');

    if (!admin) {
        return null;
    }

    return {
        id: admin._id.toString(),
        userId: admin.userId._id.toString(),
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        user: admin.userId ? {
            name: (admin.userId as unknown as { name: string }).name,
            email: (admin.userId as unknown as { email: string }).email,
            image: (admin.userId as unknown as { image: string }).image,
        } : undefined,
    };
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    const admin = await getCurrentAdmin();
    return admin?.role === 'SUPER_ADMIN';
}

/**
 * Check if current user has specific permission
 */
export async function hasAdminPermission(permission: keyof AdminUser['permissions']): Promise<boolean> {
    const admin = await getCurrentAdmin();
    if (!admin) return false;

    // Super admins have all permissions
    if (admin.role === 'SUPER_ADMIN') return true;

    return admin.permissions[permission] ?? false;
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<AdminUser> {
    const admin = await getCurrentAdmin();

    if (!admin) {
        throw new Error('Admin access required');
    }

    return admin;
}

/**
 * Require specific permission - throws if not allowed
 */
export async function requireAdminPermission(permission: keyof AdminUser['permissions']): Promise<AdminUser> {
    const admin = await requireAdmin();

    if (admin.role !== 'SUPER_ADMIN' && !admin.permissions[permission]) {
        throw new Error(`Permission denied: ${permission}`);
    }

    return admin;
}

/**
 * Check if a user is an admin (helper for middleware)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;

    await connectDB();

    const admin = await Admin.findOne({ userId: new Types.ObjectId(userId) });
    return !!admin;
}

/**
 * Get all admins (super admin only)
 */
export async function getAllAdmins(): Promise<AdminUser[]> {
    await connectDB();

    const admins = await Admin.find().populate('userId', 'name email image');

    return admins.map(admin => ({
        id: admin._id.toString(),
        userId: admin.userId._id.toString(),
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        user: admin.userId ? {
            name: (admin.userId as unknown as { name: string }).name,
            email: (admin.userId as unknown as { email: string }).email,
            image: (admin.userId as unknown as { image: string }).image,
        } : undefined,
    }));
}
