'use server';

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { Admin } from '@/models/Admin';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';
import { requireAdminPermission } from '@/lib/admin-auth';

/**
 * Get platform overview stats
 * SECURITY: Requires admin permission
 */
export async function getPlatformStats() {
    await requireAdminPermission('analytics');
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get counts
    const [
        totalUsers,
        totalWorkspaces,
        totalBoards,
        totalTasks,
        totalAdmins,
    ] = await Promise.all([
        User.countDocuments(),
        Workspace.countDocuments({ archived: { $ne: true } }),
        Board.countDocuments(),
        Task.countDocuments(),
        Admin.countDocuments(),
    ]);

    // Get new users this month vs last month
    const [newUsersThisMonth, newUsersLastMonth] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        User.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        }),
    ]);

    // Get new workspaces this month
    const newWorkspacesThisMonth = await Workspace.countDocuments({
        createdAt: { $gte: startOfMonth },
    });

    // Calculate growth percentages
    const userGrowth = newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : 100;

    // Get plan distribution
    const planDistribution = await User.aggregate([
        {
            $group: {
                _id: '$plan',
                count: { $sum: 1 },
            },
        },
    ]);

    const plans = {
        free: 0,
        starter: 0,
        pro: 0,
        enterprise: 0,
    };

    planDistribution.forEach((p) => {
        if (p._id in plans) {
            plans[p._id as keyof typeof plans] = p.count;
        }
    });

    return {
        totalUsers,
        totalWorkspaces,
        totalBoards,
        totalTasks,
        totalAdmins,
        newUsersThisMonth,
        newWorkspacesThisMonth,
        userGrowth,
        plans,
    };
}

/**
 * Get user growth data for charts
 * SECURITY: Requires admin permission
 */
export async function getUserGrowthData(days: number = 30) {
    await requireAdminPermission('analytics');
    await connectDB();

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userGrowth = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    // Fill in missing dates with 0
    const result = [];
    const dateMap = new Map(userGrowth.map((u) => [u._id, u.count]));

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            users: dateMap.get(dateStr) || 0,
        });
    }

    return result;
}

/**
 * Get workspace growth data
 * SECURITY: Requires admin permission
 */
export async function getWorkspaceGrowthData(days: number = 30) {
    await requireAdminPermission('analytics');
    await connectDB();

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const workspaceGrowth = await Workspace.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    // Fill in missing dates with 0
    const result = [];
    const dateMap = new Map(workspaceGrowth.map((w) => [w._id, w.count]));

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            workspaces: dateMap.get(dateStr) || 0,
        });
    }

    return result;
}

/**
 * Get task statistics
 * SECURITY: Requires admin permission
 */
export async function getTaskStats() {
    await requireAdminPermission('analytics');
    await connectDB();

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalTasks,
        tasksByStatus,
        tasksCreatedToday,
        tasksCreatedThisWeek,
    ] = await Promise.all([
        Task.countDocuments(),
        Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]),
        Task.countDocuments({ createdAt: { $gte: startOfDay } }),
        Task.countDocuments({ createdAt: { $gte: startOfWeek } }),
    ]);

    const statusCounts: Record<string, number> = {
        BACKLOG: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
        ARCHIVED: 0,
    };

    tasksByStatus.forEach((t) => {
        if (t._id in statusCounts) {
            statusCounts[t._id] = t.count;
        }
    });

    return {
        total: totalTasks,
        byStatus: statusCounts,
        createdToday: tasksCreatedToday,
        createdThisWeek: tasksCreatedThisWeek,
    };
}

/**
 * Get top workspaces by activity
 * SECURITY: Requires admin permission
 */
export async function getTopWorkspaces(limit: number = 10) {
    await requireAdminPermission('analytics');
    await connectDB();

    const workspaces = await Workspace.find({ archived: { $ne: true } })
        .select('name slug memberCount')
        .lean();

    const workspaceIds = workspaces.map((w) => w._id);

    const taskCounts = await Task.aggregate([
        { $match: { workspaceId: { $in: workspaceIds } } },
        {
            $group: {
                _id: '$workspaceId',
                taskCount: { $sum: 1 },
            },
        },
    ]);

    const taskMap = new Map(taskCounts.map((t) => [t._id.toString(), t.taskCount]));

    const result = workspaces
        .map((ws) => ({
            id: ws._id.toString(),
            name: ws.name,
            slug: ws.slug,
            taskCount: taskMap.get(ws._id.toString()) || 0,
        }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, limit);

    return result;
}

/**
 * Get recent activity
 * SECURITY: Requires admin permission
 */
export async function getRecentActivity(limit: number = 20) {
    await requireAdminPermission('analytics');
    await connectDB();

    const activities = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return activities.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId.toString(),
        details: a.details,
        createdAt: a.createdAt,
    }));
}
