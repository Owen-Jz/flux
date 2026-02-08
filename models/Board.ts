import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBoard extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    color: string;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String },
        color: { type: String, default: '#6366f1' },
        icon: { type: String },
    },
    { timestamps: true }
);

// Compound index for unique slug within a workspace
BoardSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

export const Board: Model<IBoard> = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
