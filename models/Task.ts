import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ITask extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    boardId: Types.ObjectId;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    categoryId?: Types.ObjectId;
    order: number;
    subtasks: { _id: Types.ObjectId; title: string; completed: boolean; createdAt: Date; createdBy?: Types.ObjectId }[];
    assignees: Types.ObjectId[];
    comments: {
        _id: Types.ObjectId;
        content: string;
        userId: Types.ObjectId;
        createdAt: Date;
        updatedAt: Date;
    }[];
    tags: string[];
    dueDate?: Date;
    links?: { _id: Types.ObjectId; url: string; title: string }[];
    parentTaskId?: Types.ObjectId;
    summary?: string;
    referenceUrls?: string[];
    requestedCompletionDate?: Date;
    isDecomposedTask?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'ARCHIVED'], default: 'BACKLOG', index: true },
        priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
        categoryId: { type: Schema.Types.ObjectId },
        order: { type: Number, default: 0 },
        assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        subtasks: [
            {
                title: { type: String, required: true },
                completed: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
                createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        tags: [{ type: String }],
        links: [
            {
                url: { type: String, required: true },
                title: { type: String },
            },
        ],
        comments: [
            new Schema(
                {
                    content: { type: String, required: true },
                    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                },
                { timestamps: true }
            ),
        ],
        dueDate: { type: Date },
        parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
        summary: { type: String },
        referenceUrls: [{ type: String }],
        requestedCompletionDate: { type: Date },
        isDecomposedTask: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound index for common query: boardId + status (for filtering tasks by column)
TaskSchema.index({ boardId: 1, status: 1 });

// Compound index for ordering within a column
TaskSchema.index({ boardId: 1, status: 1, order: 1 });

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
