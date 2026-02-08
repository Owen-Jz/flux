import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface IMember {
    userId: Types.ObjectId;
    role: MemberRole;
    joinedAt: Date;
}

export interface IWorkspace extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    ownerId: Types.ObjectId;
    inviteCode: string;
    settings: {
        publicAccess: boolean;
    };
    members: IMember[];
    createdAt: Date;
    updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['ADMIN', 'EDITOR', 'VIEWER'], default: 'VIEWER' },
        joinedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        inviteCode: { type: String, unique: true },
        settings: {
            publicAccess: { type: Boolean, default: false },
        },
        members: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
                role: { type: String, enum: ['ADMIN', 'EDITOR', 'VIEWER'], default: 'VIEWER' },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

// Index for efficient querying of workspaces by member ID
WorkspaceSchema.index({ 'members.userId': 1 });

// Compound index for unique slug within a workspace
// Wait, slug is unique globally. The index is on { slug: 1 } (globally unique).
// Oh, previous code had `slug: { ... unique: true }`.
// Board schema had compound index. Workspace schema is global.

export const Workspace: Model<IWorkspace> =
    mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
