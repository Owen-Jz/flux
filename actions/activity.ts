'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ActivityLog, ActivityType } from '@/models/ActivityLog';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { Types } from 'mongoose';

interface LogActivityParams {
    workspaceSlug: string;
    boardSlug: string;
    taskId?: string;
    type: ActivityType;
    title: string;
    description: string;
    metadata?: {
        taskTitle?: string;
        previousStatus?: string;
        newStatus?: string;
        assigneeId?: string;
        assigneeName?: string;
        commentContent?: string;
        categoryName?: string;
    };
}

export async function logActivity(params: LogActivityParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return null; // Silent fail if not authenticated
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: params.workspaceSlug });
    if (!workspace) return null;

    const board = await Board.findOne({ workspaceId: workspace._id, slug: params.boardSlug });
    if (!board) return null;

    try {
        const activity = await ActivityLog.create({
            workspaceId: workspace._id,
            boardId: board._id,
            taskId: params.taskId ? new Types.ObjectId(params.taskId) : undefined,
            userId: new Types.ObjectId(session.user.id),
            type: params.type,
            title: params.title,
            description: params.description,
            metadata: {
                ...params.metadata,
                boardSlug: params.boardSlug,
                boardName: board.name,
            },
            read: false,
        });

        return { id: activity._id.toString() };
    } catch (error) {
        console.error('Failed to log activity:', error);
        return null;
    }
}

export async function getActivities(workspaceSlug: string, limit: number = 20) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    // Check membership
    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === session.user.id
    );
    if (!isMember) return [];

    const activities = await ActivityLog.find({ workspaceId: workspace._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    // Get user info for each activity
    const userIds = [...new Set(activities.map(a => a.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return activities.map(activity => {
        const user = userMap.get(activity.userId.toString());
        return {
            id: activity._id.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            taskId: activity.taskId?.toString(),
            boardSlug: activity.metadata?.boardSlug,
            read: activity.read,
            createdAt: activity.createdAt.toISOString(),
            user: user ? {
                id: user._id.toString(),
                name: user.name || 'Unknown',
                image: user.image,
            } : null,
        };
    });
}

export async function getCommentActivities(workspaceSlug: string, limit: number = 20) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    // Check membership
    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === session.user.id
    );
    if (!isMember) return [];

    const activities = await ActivityLog.find({
        workspaceId: workspace._id,
        type: 'COMMENT_ADDED'
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    // Get user info for each activity
    const userIds = [...new Set(activities.map(a => a.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return activities.map(activity => {
        const user = userMap.get(activity.userId.toString());
        return {
            id: activity._id.toString(),
            content: activity.metadata?.commentContent || '',
            taskTitle: activity.metadata?.taskTitle || 'Unknown Task',
            taskId: activity.taskId?.toString(),
            boardSlug: activity.metadata?.boardSlug,
            createdAt: activity.createdAt.toISOString(),
            user: user ? {
                id: user._id.toString(),
                name: user.name || 'Unknown',
                image: user.image,
            } : null,
        };
    });
}

export async function markActivityAsRead(activityId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    await connectDB();

    await ActivityLog.findByIdAndUpdate(activityId, { read: true });
    return { success: true };
}

export async function markAllActivitiesAsRead(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return { success: false };

    await ActivityLog.updateMany(
        { workspaceId: workspace._id, read: false },
        { read: true }
    );

    return { success: true };
}

export async function getUnreadActivityCount(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return 0;

    const count = await ActivityLog.countDocuments({
        workspaceId: workspace._id,
        read: false
    });

    return count;
}
