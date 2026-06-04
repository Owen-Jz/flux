import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Durable, cross-instance usage counter for the anonymous "try it" planner.
 * In-memory rate limiting is per-instance and resets on cold start, so it can't
 * protect the LLM budget on serverless. This collection is the shared source of
 * truth: per-IP daily counters and a global daily circuit breaker. Documents
 * self-expire via a TTL index so the collection stays small.
 */
export interface IAnonPlanUsage extends Document {
    key: string; // e.g. "global:2026-06-03" or "ip:<ip>:2026-06-03"
    count: number;
    expiresAt: Date;
}

const AnonPlanUsageSchema = new Schema<IAnonPlanUsage>({
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
});

// TTL index: MongoDB removes each document once expiresAt passes.
AnonPlanUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AnonPlanUsage: Model<IAnonPlanUsage> =
    mongoose.models.AnonPlanUsage || mongoose.model<IAnonPlanUsage>('AnonPlanUsage', AnonPlanUsageSchema);
