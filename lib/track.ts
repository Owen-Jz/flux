import { connectDB } from '@/lib/db';
import { ProductEvent, ProductEventName } from '@/models/ProductEvent';
import { Types } from 'mongoose';

interface TrackEventInput {
    event: ProductEventName;
    userId?: string | null;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
}

function toObjectId(id: string | null | undefined): Types.ObjectId | null {
    if (id && Types.ObjectId.isValid(id)) {
        return new Types.ObjectId(id);
    }
    return null;
}

/**
 * First-party product analytics writer. Records a single funnel event.
 *
 * Analytics must NEVER break a user-facing action: every failure is caught and
 * logged, never thrown. Callers should run this through `after()` (route
 * handlers / server actions) so the write happens off the response path; in
 * contexts where `after()` is unavailable (NextAuth callbacks) it is safe to
 * await directly.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
    try {
        await connectDB();

        const userId = toObjectId(input.userId);
        const workspaceId = toObjectId(input.workspaceId);
        const day = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

        // `app_opened` fires on every authenticated page load. Collapse it to one
        // row per user per day so the collection stays small and "returned on a
        // later day" is a cheap distinct-day count rather than a flood of rows.
        // Anonymous opens (no resolvable user, e.g. the env admin session) are
        // not recorded — they would have no user to attribute and can't dedupe.
        if (input.event === 'app_opened') {
            if (!userId) return;
            await ProductEvent.updateOne(
                { userId, event: 'app_opened', day },
                {
                    $setOnInsert: {
                        userId,
                        event: 'app_opened',
                        day,
                        ...(workspaceId ? { workspaceId } : {}),
                    },
                },
                { upsert: true }
            );
            return;
        }

        await ProductEvent.create({
            userId,
            event: input.event,
            day,
            ...(workspaceId ? { workspaceId } : {}),
            ...(input.metadata ? { metadata: input.metadata } : {}),
        });
    } catch (err) {
        console.error(`[track] Failed to record event "${input.event}":`, err);
    }
}
