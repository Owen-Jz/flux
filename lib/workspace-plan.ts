import { Types } from 'mongoose';
import { User } from '@/models/User';
import { getEffectivePlan } from '@/lib/plan-limits';
import type { PlanType } from '@/lib/types/billing';

/**
 * Resolve the effective plan that governs a workspace's RESOURCE limits (boards, active
 * tasks, members). These caps belong to the workspace, so they key off the workspace
 * OWNER's plan — not whichever member happens to be performing the action. A free collaborator
 * inside a Pro owner's workspace therefore gets the Pro capacity, and a Pro collaborator can't
 * blow past a Free workspace's ceiling.
 *
 * Falls back to 'free' if the owner can't be found (defensive default — never over-grants).
 */
export async function resolveWorkspacePlan(ownerId: Types.ObjectId | string): Promise<PlanType> {
    const owner = await User.findById(ownerId)
        .select('plan subscriptionStatus trialEndsAt')
        .lean<{ plan?: PlanType; subscriptionStatus?: string; trialEndsAt?: Date | null } | null>();

    if (!owner) return 'free';

    return getEffectivePlan({
        plan: (owner.plan || 'free') as PlanType,
        subscriptionStatus: owner.subscriptionStatus,
        trialEndsAt: owner.trialEndsAt ?? null,
    });
}
