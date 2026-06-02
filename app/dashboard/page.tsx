import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    Cog6ToothIcon,
    BuildingOffice2Icon,
    Squares2X2Icon,
    UsersIcon,
    BellAlertIcon,
} from '@heroicons/react/24/outline';
import { auth } from '@/lib/auth';
import { getWorkspaceUnreadCounts, getWorkspaces } from '@/actions/workspace';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { WorkspaceBrowser, type WorkspaceBrowserItem } from '@/components/dashboard/workspace-browser';
import NewWorkspaceButton from '@/components/dashboard/NewWorkspaceButton';
import { TrialPromptWrapper } from '@/components/onboarding/TrialPromptWrapper';
import { UpgradeWelcomeWrapper } from '@/components/billing/upgrade-welcome-wrapper';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        // A signed-in session without an id means the JWT couldn't resolve the user
        // (typically a transient DB issue during sign-in). Send them back to log in.
        redirect('/login');
    }

    // Gate: if user hasn't completed onboarding, send them there first
    try {
        await connectDB();
        const onboardingUser = await User.findById(session.user.id).select('hasCompletedOnboarding').lean();
        if (onboardingUser && !onboardingUser.hasCompletedOnboarding) {
            redirect('/onboarding');
        }
    } catch (e) {
        console.error('[Dashboard] Failed to check onboarding status:', e);
    }

    const workspaces = await getWorkspaces();

    // Redirect to onboarding if user has no workspaces
    if (workspaces.length === 0) {
        redirect('/onboarding');
    }

    const unreadCounts = await getWorkspaceUnreadCounts(workspaces.map(w => w.slug));

    let trialEndsAt: string | null = null;
    let subscriptionStatus: string | null = null;
    let hasUsedTrial = false;
    let trialPromptDismissedAt: string | null = null;
    let lastUpgradeAt: string | null = null;
    let userPlan: string = 'free';

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('trialEndsAt subscriptionStatus hasUsedTrial trialPromptDismissedAt lastUpgradeAt plan').lean();
        if (user) {
            trialEndsAt = user.trialEndsAt ? user.trialEndsAt.toISOString() : null;
            subscriptionStatus = user.subscriptionStatus || null;
            hasUsedTrial = user.hasUsedTrial || false;
            trialPromptDismissedAt = user.trialPromptDismissedAt ? user.trialPromptDismissedAt.toISOString() : null;
            lastUpgradeAt = user.lastUpgradeAt ? user.lastUpgradeAt.toISOString() : null;
            userPlan = user.plan || 'free';
        }
    } catch (error) {
        console.error('Failed to fetch trial status:', error);
    }

    const userName = session.user.name?.split(' ')[0] || 'there';

    const totalBoards = workspaces.reduce((acc, w) => acc + w.boardCount, 0);
    const totalMembers = workspaces.reduce((acc, w) => acc + w.memberCount, 0);
    const totalUnread = Object.values(unreadCounts).reduce((acc, n) => acc + n, 0);

    const browserItems: WorkspaceBrowserItem[] = workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        accentColor: w.accentColor,
        icon: w.icon,
        memberCount: w.memberCount,
        boardCount: w.boardCount,
        lastActiveAt: new Date(w.lastActiveAt).toISOString(),
        hasUnread: (unreadCounts[w.slug] ?? 0) > 0,
    }));

    return (
        <>
            <TrialPromptWrapper
                trialEndsAt={trialEndsAt}
                subscriptionStatus={subscriptionStatus}
                hasUsedTrial={hasUsedTrial}
                trialPromptDismissedAt={trialPromptDismissedAt}
            />
            <UpgradeWelcomeWrapper
                lastUpgradeAt={lastUpgradeAt}
                plan={userPlan}
            />
            <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div
                        className="absolute left-1/2 top-0 h-[400px] w-[800px] max-w-full -translate-x-1/2 animate-pulse opacity-30"
                        style={{
                            background: 'radial-gradient(ellipse, var(--flux-brand-primary) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                        }}
                    />
                    <div
                        className="absolute bottom-0 right-0 h-[300px] w-[600px] max-w-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, var(--flux-brand-secondary) 0%, transparent 70%)',
                            filter: 'blur(100px)',
                        }}
                    />
                </div>

                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                    <DashboardHeader
                        eyebrow="Dashboard"
                        title="Your workspaces"
                        subtitle={
                            <span className="hidden sm:inline">
                                Welcome back, {userName}. Select a workspace to continue.
                            </span>
                        }
                        actions={
                            <>
                                <NewWorkspaceButton />
                                <Link
                                    href="/settings"
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] transition-colors hover:border-[var(--brand-primary)]/30 sm:h-10 sm:w-10"
                                    aria-label="Settings"
                                >
                                    <Cog6ToothIcon className="h-5 w-5 text-[var(--text-secondary)]" />
                                </Link>
                            </>
                        }
                    />

                    <dl className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
                        <StatTile
                            label={workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
                            value={workspaces.length}
                            icon={<BuildingOffice2Icon className="h-5 w-5" />}
                        />
                        <StatTile
                            label={totalBoards === 1 ? 'Board' : 'Boards'}
                            value={totalBoards}
                            icon={<Squares2X2Icon className="h-5 w-5" />}
                        />
                        <StatTile
                            label={totalMembers === 1 ? 'Member' : 'Members'}
                            value={totalMembers}
                            icon={<UsersIcon className="h-5 w-5" />}
                        />
                        <StatTile
                            label={totalUnread === 1 ? 'Update' : 'Updates'}
                            value={totalUnread}
                            icon={<BellAlertIcon className="h-5 w-5" />}
                        />
                    </dl>

                    <WorkspaceBrowser workspaces={browserItems} userPlan={userPlan} />
                </div>
            </div>
        </>
    );
}
