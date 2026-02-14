import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueType = 'BUG' | 'FEATURE' | 'IMPROVEMENT';

export interface IIssue extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    reporterId: Types.ObjectId;
    assigneeId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
        priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
        type: { type: String, enum: ['BUG', 'FEATURE', 'IMPROVEMENT'], default: 'BUG' },
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export const Issue: Model<IIssue> = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);
