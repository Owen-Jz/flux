'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { isWorkspaceMember } from '@/lib/workspace-utils';
import { getPlanLimits } from '@/lib/plan-limits';
import { resolveWorkspacePlan } from '@/lib/workspace-plan';
import { getAiCreditStatus } from '@/lib/ai-credits';
import type { PlanType } from '@/lib/types/billing';

type LimitValue = number | 'unlimited';

export interface UsageMetric {
    used: number;
    limit: LimitValue;
}

export interface WorkspaceUsage {
    plan: PlanType;
    boards: UsageMetric;
    tasks: UsageMetric;
    members: UsageMetric;
}

export interface AiUsage {
    plan: PlanType;
    used: number;
    limit: LimitValue;
    remaining: LimitValue;
    resetAt: string | null; // ISO
    allowed: boolean;
}

/**
 * Read-only usage snapshot for a workspace: how many boards, active (non-archived) tasks,
 * and members it currently holds, paired with the limits granted by the workspace OWNER's
 * effective plan. Resource caps key off the owner's plan (via `resolveWorkspacePlan`), so a
 * collaborator sees the workspace's true ceiling regardless of their own plan.
 *
 * Returns null when the caller is unauthenticated, the workspace doesn't exist, or the caller
 * is not a member — never leaks usage to non-members.
 */
export async function getWorkspaceUsage(workspaceSlug: string): Promise<WorkspaceUsage | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return null;

    if (!isWorkspaceMember(workspace, session.user.id)) return null;

    const plan = await resolveWorkspacePlan(workspace.ownerId);
    const limits = getPlanLimits(plan);

    const [boardsCount, tasksCount] = await Promise.all([
        Board.countDocuments({ workspaceId: workspace._id }),
        Task.countDocuments({ workspaceId: workspace._id, status: { $ne: 'ARCHIVED' } }),
    ]);

    return {
        plan,
        boards: { used: boardsCount, limit: limits.projects },
        tasks: { used: tasksCount, limit: limits.tasks },
        members: { used: workspace.members.length, limit: limits.members },
    };
}

/**
 * Read-only "Plan with AI" allowance for the current user. Mirrors `getAiCreditStatus` but
 * returns a serialisable shape (ISO reset date) safe to hand to a client component.
 *
 * Returns null when the caller is unauthenticated.
 */
export async function getAiUsage(): Promise<AiUsage | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    await connectDB();

    const s = await getAiCreditStatus(session.user.id);

    return {
        plan: s.plan,
        used: s.used,
        limit: s.limit,
        remaining: s.remaining,
        resetAt: s.resetAt ? s.resetAt.toISOString() : null,
        allowed: s.allowed,
    };
}
