'use server';

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface IAccessRequest extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    userId: Types.ObjectId;
    requestedRole: 'EDITOR';
    status: RequestStatus;
    message?: string;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        requestedRole: { type: String, enum: ['EDITOR'], default: 'EDITOR' },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING' },
        message: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

// Compound index to prevent duplicate pending requests
AccessRequestSchema.index({ workspaceId: 1, userId: 1, status: 1 });

export const AccessRequest: Model<IAccessRequest> =
    mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);
