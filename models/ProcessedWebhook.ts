import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedWebhook extends Document {
  eventId: string;
  processedAt: Date;
}

const ProcessedWebhookSchema = new Schema<IProcessedWebhook>({
  eventId: { type: String, required: true, unique: true, index: true },
  processedAt: { type: Date, default: Date.now },
});

// TTL index for auto-cleanup after 7 days
ProcessedWebhookSchema.index({ processedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const ProcessedWebhook: Model<IProcessedWebhook> =
  mongoose.models.ProcessedWebhook || mongoose.model<IProcessedWebhook>('ProcessedWebhook', ProcessedWebhookSchema);
