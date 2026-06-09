import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * First-party product analytics. One document per meaningful funnel action so
 * we can answer "where do users fall off?" without a third-party tracker, cookie
 * consent, or data leaving our infrastructure.
 *
 * The funnel we care about for early adoption:
 *   signup → board_created → ai_plan_used → task_created → returned → member_invited
 *
 * `member_invited` is the real success metric: it is the only event that proves
 * the coordination value landed (someone wanted a teammate/client in the board).
 */
export const PRODUCT_EVENT_NAMES = [
    'signup',
    'app_opened',
    'board_created',
    'ai_plan_used',
    'task_created',
    'member_invited',
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export interface IProductEvent extends Document {
    userId: Types.ObjectId | null;
    event: ProductEventName;
    workspaceId?: Types.ObjectId;
    metadata?: Record<string, unknown>;
    /** UTC YYYY-MM-DD bucket — makes "returned on a later day" a cheap distinct-day count. */
    day: string;
    createdAt: Date;
}

const ProductEventSchema = new Schema<IProductEvent>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        event: { type: String, required: true, enum: PRODUCT_EVENT_NAMES, index: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
        metadata: { type: Schema.Types.Mixed },
        day: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Funnel queries group by event over recent time.
ProductEventSchema.index({ event: 1, createdAt: -1 });
// Per-user retention: distinct active days and per-user event lookups.
ProductEventSchema.index({ userId: 1, event: 1, day: 1 });

export const ProductEvent: Model<IProductEvent> =
    mongoose.models.ProductEvent || mongoose.model<IProductEvent>('ProductEvent', ProductEventSchema);
