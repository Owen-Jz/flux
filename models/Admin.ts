'use server';

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'ANALYTICS_ADMIN';

export interface IAdmin extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    role: AdminRole;
    permissions: {
        users: boolean;
        workspaces: boolean;
        analytics: boolean;
        settings: boolean;
        billing: boolean;
    };
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        role: { type: String, enum: ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'ANALYTICS_ADMIN'], default: 'SUPPORT_ADMIN' },
        permissions: {
            users: { type: Boolean, default: true },
            workspaces: { type: Boolean, default: true },
            analytics: { type: Boolean, default: true },
            settings: { type: Boolean, default: false },
            billing: { type: Boolean, default: false },
        },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

export const Admin: Model<IAdmin> =
    mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
