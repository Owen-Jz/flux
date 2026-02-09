import mongoose from 'mongoose';

export type ActivityType =
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_DELETED'
    | 'TASK_MOVED'
    | 'TASK_ASSIGNED'
    | 'COMMENT_ADDED'
    | 'SUBTASK_COMPLETED'
    | 'CATEGORY_CHANGED';

export interface IActivityLog {
    _id: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    boardId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: ActivityType;
    title: string;
    description: string;
    metadata?: {
        taskTitle?: string;
        boardSlug?: string;
        boardName?: string;
        previousStatus?: string;
        newStatus?: string;
        assigneeId?: string;
        assigneeName?: string;
        commentContent?: string;
        categoryName?: string;
    };
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityLogSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true
        },
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true,
            index: true
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        type: {
            type: String,
            required: true,
            enum: [
                'TASK_CREATED',
                'TASK_UPDATED',
                'TASK_DELETED',
                'TASK_MOVED',
                'TASK_ASSIGNED',
                'COMMENT_ADDED',
                'SUBTASK_COMPLETED',
                'CATEGORY_CHANGED'
            ]
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        metadata: {
            taskTitle: String,
            boardSlug: String,
            boardName: String,
            previousStatus: String,
            newStatus: String,
            assigneeId: String,
            assigneeName: String,
            commentContent: String,
            categoryName: String,
        },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for efficient queries
ActivityLogSchema.index({ workspaceId: 1, createdAt: -1 });
ActivityLogSchema.index({ workspaceId: 1, type: 1, createdAt: -1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
