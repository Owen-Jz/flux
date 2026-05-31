import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BoardVisibility = 'WORKSPACE' | 'RESTRICTED';

export interface IBoard extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    color: string;
    icon?: string;
    categories: {
        _id: Types.ObjectId;
        name: string;
        color: string;
    }[];
    // Access control.
    // WORKSPACE  → every workspace member can see the board (default; legacy boards behave this way).
    // RESTRICTED → only users listed in `memberIds`, plus workspace ADMINs, can see the board.
    visibility: BoardVisibility;
    memberIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
});

const BoardSchema = new Schema<IBoard>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String },
        color: { type: String, default: '#6366f1' },
        icon: { type: String },
        categories: { type: [CategorySchema], default: [] },
        visibility: {
            type: String,
            enum: ['WORKSPACE', 'RESTRICTED'],
            default: 'WORKSPACE',
            index: true,
        },
        memberIds: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    },
    { timestamps: true }
);

// Compound index for unique slug within a workspace
BoardSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

// Supports the per-user visibility filter (restricted boards a user belongs to).
BoardSchema.index({ workspaceId: 1, memberIds: 1 });

export const Board: Model<IBoard> = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
