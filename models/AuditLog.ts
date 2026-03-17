'use server';

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AuditTargetType = 'user' | 'workspace' | 'task' | 'board' | 'admin';

export interface IAuditLog extends Document {
    _id: Types.ObjectId;
    adminId: Types.ObjectId;
    action: string;
    targetType: AuditTargetType;
    targetId: Types.ObjectId;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
        action: { type: String, required: true, index: true },
        targetType: { type: String, enum: ['user', 'workspace', 'task', 'board', 'admin'], required: true, index: true },
        targetId: { type: Schema.Types.ObjectId, required: true, index: true },
        details: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

// Index for efficient querying by date range
AuditLogSchema.index({ createdAt: -1 });
// Compound index for admin action logs
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
// Compound index for target lookups
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
