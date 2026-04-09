import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFailedWebhook extends Document {
    eventType: string;
    payload: Record<string, unknown>;
    error: string;
    createdAt: Date;
}

const FailedWebhookSchema = new Schema<IFailedWebhook>(
    {
        eventType: { type: String, required: true },
        payload: { type: Schema.Types.Mixed, required: true },
        error: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const FailedWebhook: Model<IFailedWebhook> =
    mongoose.models.FailedWebhook || mongoose.model<IFailedWebhook>('FailedWebhook', FailedWebhookSchema);
