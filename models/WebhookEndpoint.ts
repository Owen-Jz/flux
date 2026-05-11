import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWebhookEndpoint extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    url: string;
    signingSecret: string;
    events: string[];
    workspaceFilter?: Types.ObjectId;
    active: boolean;
    createdAt: Date;
}

const WebhookEndpointSchema = new Schema<IWebhookEndpoint>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        url: { type: String, required: true },
        signingSecret: { type: String, required: true },
        events: [{ type: String, required: true }],
        workspaceFilter: { type: Schema.Types.ObjectId, ref: 'Workspace' },
        active: { type: Boolean, default: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

WebhookEndpointSchema.index({ userId: 1, active: 1 });

export const WebhookEndpoint: Model<IWebhookEndpoint> =
    mongoose.models.WebhookEndpoint || mongoose.model<IWebhookEndpoint>('WebhookEndpoint', WebhookEndpointSchema);