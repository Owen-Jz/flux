import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookKeyRotation extends Document {
    currentKeyHash: string;
    previousKeyHash: string;
    keyHint: string;
    rotatedAt: Date;
}

const WebhookKeyRotationSchema = new Schema<IWebhookKeyRotation>({
    currentKeyHash: { type: String, required: true },
    previousKeyHash: { type: String, required: true },
    keyHint: { type: String, required: true },
    rotatedAt: { type: Date, default: Date.now },
});

export const WebhookKeyRotation: Model<IWebhookKeyRotation> =
    mongoose.models.WebhookKeyRotation || mongoose.model<IWebhookKeyRotation>('WebhookKeyRotation', WebhookKeyRotationSchema);