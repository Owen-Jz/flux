import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPushSubscription extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    endpoint: string;
    p256dh: string;
    auth: string;
    workspaceId?: string;
    userAgent?: string;
    createdAt: Date;
    lastUsedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        endpoint: { type: String, required: true, unique: true },
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
        workspaceId: { type: String, index: true },
        userAgent: { type: String, maxlength: 500 },
        lastUsedAt: { type: Date, default: Date.now },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

PushSubscriptionSchema.index({ userId: 1, workspaceId: 1 });

export const PushSubscription: Model<IPushSubscription> =
    mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
