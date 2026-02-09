import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
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
    subtasks: { _id: Types.ObjectId; title: string; completed: boolean }[];
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
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'], default: 'BACKLOG' },
        priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
        categoryId: { type: Schema.Types.ObjectId },
        order: { type: Number, default: 0 },
        assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        subtasks: [
            {
                title: { type: String, required: true },
                completed: { type: Boolean, default: false },
            },
        ],
        tags: [{ type: String }],
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
    },
    { timestamps: true }
);

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
