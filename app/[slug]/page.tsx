import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoards, getBoardTaskStats } from '@/actions/board';
import { getUserRole, hasPendingRequest } from '@/actions/access-control';
import {
    EyeIcon,
    Squares2X2Icon,
    UsersIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { RequestAccessButton } from '@/components/RequestAccessButton';
import BoardGrid from '@/components/BoardGrid';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { WorkspaceUnreadDot } from './workspace-unread-dot';
import { ReferralPromptWrapper } from '@/components/onboarding/referral-prompt-wrapper';
import { TrialPromptWrapper } from '@/components/onboarding/TrialPromptWrapper';
import { PlanWithAIIntroWrapper } from '@/components/onboarding/plan-with-ai-intro-wrapper';
import { PlanWorkspaceButton } from '@/components/workspace/plan-workspace-button';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export default async function WorkspacePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        notFound();
    }

    const boards = await getBoards(slug);
    const boardStats = await getBoardTaskStats(slug);
    const userRole = await getUserRole(slug);
    const hasPending = session?.user ? await hasPendingRequest(slug) : false;

    const totalTasks = Object.values(boardStats).reduce((acc, s) => acc + s.total, 0);
    const doneTasks = Object.values(boardStats).reduce((acc, s) => acc + s.done, 0);
    const donePct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const memberCount = workspace.members.length;

    // Fetch trial status for the trial prompt modal
    let trialEndsAt: string | null = null;
    let subscriptionStatus: string | null = null;
    let hasUsedTrial = false;
    let trialPromptDismissedAt: string | null = null;

    try {
        await connectDB();
        const user = await User.findById(session?.user?.id).select('trialEndsAt subscriptionStatus hasUsedTrial trialPromptDismissedAt').lean();
        if (user) {
            trialEndsAt = user.trialEndsAt ? user.trialEndsAt.toISOString() : null;
            subscriptionStatus = user.subscriptionStatus || null;
            hasUsedTrial = user.hasUsedTrial || false;
            trialPromptDismissedAt = user.trialPromptDismissedAt ? user.trialPromptDismissedAt.toISOString() : null;
        }
    } catch (error) {
        console.error('Failed to fetch trial status:', error);
    }

    // Determine user's access level
    const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
    const isViewer = userRole === 'VIEWER' || (!userRole && workspace.publicAccess);

    return (
        <>
            <TrialPromptWrapper
                trialEndsAt={trialEndsAt}
                subscriptionStatus={subscriptionStatus}
                hasUsedTrial={hasUsedTrial}
                trialPromptDismissedAt={trialPromptDismissedAt}
            />
            <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <DashboardHeader
                    eyebrow="Workspace"
                    title={
                        <>
                            <span className="min-w-0 truncate">{workspace.name}</span>
                            <span className="flex-shrink-0">
                                <WorkspaceUnreadDot workspaceSlug={slug} />
                            </span>
                        </>
                    }
                    subtitle={
                        <span className="flex flex-wrap items-center gap-2">
                            {userRole && (
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        userRole === 'ADMIN'
                                            ? 'bg-[var(--flux-info-bg)] text-[var(--flux-info-text-strong)] border border-[var(--flux-info-border)]'
                                            : userRole === 'EDITOR'
                                              ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                                              : 'bg-[var(--background-subtle)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {userRole}
                                </span>
                            )}
                            {workspace.publicAccess && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--background-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                                    <GlobeAltIcon className="h-3.5 w-3.5" />
                                    Public
                                </span>
                            )}
                        </span>
                    }
                    actions={
                        <>
                            {canEdit && session?.user && <PlanWorkspaceButton workspaceSlug={slug} />}
                            {isViewer && !hasPending && session?.user && <RequestAccessButton slug={slug} />}
                            {isViewer && hasPending && (
                                <div className="flex items-center gap-2 rounded-lg border border-[var(--flux-warning-border)] bg-[var(--flux-warning-bg)] px-4 py-2 text-sm font-medium text-[var(--flux-warning-text-strong)]">
                                    <EyeIcon className="h-4 w-4" />
                                    Request Pending
                                </div>
                            )}
                        </>
                    }
                />

                <dl className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
                    <StatTile
                        label={boards.length === 1 ? 'Board' : 'Boards'}
                        value={boards.length}
                        icon={<Squares2X2Icon className="h-5 w-5" />}
                    />
                    <StatTile
                        label={memberCount === 1 ? 'Member' : 'Members'}
                        value={memberCount}
                        icon={<UsersIcon className="h-5 w-5" />}
                    />
                    <StatTile
                        label={totalTasks === 1 ? 'Task' : 'Tasks'}
                        value={totalTasks}
                        icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
                    />
                    <StatTile
                        label="Completed"
                        value={`${donePct}%`}
                        icon={<CheckCircleIcon className="h-5 w-5" />}
                        hint={totalTasks > 0 ? `${doneTasks} of ${totalTasks} done` : 'No tasks yet'}
                    />
                </dl>

                <BoardGrid workspaceSlug={slug} initialBoards={boards} canEdit={canEdit} boardStats={boardStats} />
            </div>
            <ReferralPromptWrapper workspaceSlug={slug} />
            {canEdit && session?.user && (
                <PlanWithAIIntroWrapper workspaceSlug={slug} />
            )}
        </>
    );
}
