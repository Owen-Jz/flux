'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ActivityLog, ActivityType } from '@/models/ActivityLog';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { Types } from 'mongoose';
import { isWorkspaceMember } from '@/lib/workspace-utils';
import { canAccessBoard, boardVisibilityFilter } from '@/lib/board-access';

/** Board ids the given member is allowed to see within a workspace. */
async function getAccessibleBoardIds(
    workspaceId: Types.ObjectId,
    userId: string,
    member: { role?: string } | null | undefined,
): Promise<Types.ObjectId[]> {
    const boards = await Board.find({
        workspaceId,
        ...boardVisibilityFilter(userId, member),
    })
        .select('_id')
        .lean();
    return boards.map((b) => b._id);
}

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
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return [];

    // Only surface activity from boards this user can see.
    const boardIds = await getAccessibleBoardIds(workspace._id, session.user.id, member);

    const activities = await ActivityLog.find({
        workspaceId: workspace._id,
        boardId: { $in: boardIds },
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
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return [];

    // Only surface comment activity from boards this user can see.
    const boardIds = await getAccessibleBoardIds(workspace._id, session.user.id, member);

    const activities = await ActivityLog.find({
        workspaceId: workspace._id,
        type: 'COMMENT_ADDED',
        boardId: { $in: boardIds },
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

export async function markActivityAsRead(activityId: string, workspaceSlug?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    await connectDB();

    const activity = await ActivityLog.findById(activityId);
    if (!activity) {
        return { success: false };
    }

    const workspace = workspaceSlug
        ? await Workspace.findOne({ slug: workspaceSlug })
        : await Workspace.findById(activity.workspaceId);
    if (!workspace) {
        return { success: false };
    }

    if (!isWorkspaceMember(workspace, session.user.id)) {
        return { success: false };
    }

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

    // Verify user is a member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return { success: false };

    // Only clear unread state for boards this user can see.
    const boardIds = await getAccessibleBoardIds(workspace._id, session.user.id, member);

    await ActivityLog.updateMany(
        { workspaceId: workspace._id, boardId: { $in: boardIds }, read: false },
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

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return 0;

    // Count only unread activity from boards this user can see.
    const boardIds = await getAccessibleBoardIds(workspace._id, session.user.id, member);

    const count = await ActivityLog.countDocuments({
        workspaceId: workspace._id,
        boardId: { $in: boardIds },
        read: false
    });

    return count;
}

export async function getUnreadActivityCountForBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return 0;

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return 0;

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) return 0;

    // No access to the board → no count to report.
    if (!canAccessBoard(board, session.user.id, member)) return 0;

    const count = await ActivityLog.countDocuments({
        workspaceId: workspace._id,
        boardId: board._id,
        read: false,
    });

    return count;
}

export async function markAllActivitiesAsReadForBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return { success: false };

    // Verify user is a member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) return { success: false };

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) return { success: false };

    // No access to the board → nothing to mark.
    if (!canAccessBoard(board, session.user.id, member)) return { success: false };

    await ActivityLog.updateMany(
        { workspaceId: workspace._id, boardId: board._id, read: false },
        { read: true }
    );

    return { success: true };
}
