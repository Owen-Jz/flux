import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IApiKey extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    keyPrefix: string;
    keyHash: string;
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, maxlength: 100 },
        keyPrefix: { type: String, required: true, unique: true, length: 8 },
        keyHash: { type: String, required: true },
        lastUsedAt: { type: Date },
        expiresAt: { type: Date },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

ApiKeySchema.index({ userId: 1, createdAt: -1 });

export const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);