import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  userId: Types.ObjectId;
  responseHash: string;
  response: object;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  responseHash: { type: String, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// TTL index for auto-cleanup
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey: Model<IIdempotencyKey> =
  mongoose.models.IdempotencyKey || mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
