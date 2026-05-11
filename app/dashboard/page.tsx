import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { auth } from '@/lib/auth';
import { getWorkspaceUnreadCounts, getWorkspaces } from '@/actions/workspace';
import { WorkspaceCard } from '@/components/dashboard/WorkspaceCard';
import { EmptyWorkspaces } from '@/components/dashboard/EmptyWorkspaces';
import NewWorkspaceButton from '@/components/dashboard/NewWorkspaceButton';
import { TrialPromptWrapper } from '@/components/onboarding/TrialPromptWrapper';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
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

    try {
        await connectDB();
        const user = await User.findById(session.user.id).select('trialEndsAt subscriptionStatus hasUsedTrial trialPromptDismissedAt').lean();
        if (user) {
            trialEndsAt = user.trialEndsAt ? user.trialEndsAt.toISOString() : null;
            subscriptionStatus = user.subscriptionStatus || null;
            hasUsedTrial = user.hasUsedTrial || false;
            trialPromptDismissedAt = user.trialPromptDismissedAt ? user.trialPromptDismissedAt.toISOString() : null;
        }
    } catch (error) {
        console.error('Failed to fetch trial status:', error);
    }

    const userName = session.user.name?.split(' ')[0] || 'there';

    return (
        <>
            <TrialPromptWrapper
                trialEndsAt={trialEndsAt}
                subscriptionStatus={subscriptionStatus}
                hasUsedTrial={hasUsedTrial}
                trialPromptDismissedAt={trialPromptDismissedAt}
            />
            <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 animate-pulse"
                        style={{
                            background: 'radial-gradient(ellipse, var(--flux-brand-primary) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                        }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-[600px] h-[300px] opacity-20"
                        style={{
                            background: 'radial-gradient(circle, var(--flux-brand-secondary) 0%, transparent 70%)',
                            filter: 'blur(100px)',
                        }}
                    />
                </div>

                <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--flux-brand-primary)] mb-1 tracking-wide uppercase text-xs">
                                Dashboard
                            </p>
                            <h1 className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                                Your Workspaces
                            </h1>
                            <p className="text-[var(--text-secondary)] mt-1 hidden sm:block text-sm md:text-base">
                                Welcome back, {userName}. Select a workspace to continue.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <NewWorkspaceButton />
                            <Link
                                href="/settings"
                                className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 transition-colors"
                                aria-label="Settings"
                            >
                                <Cog6ToothIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 max-w-xl">
                        <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)] hover:border-[var(--flux-brand-primary)]/30 transition-colors">
                            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{workspaces.length}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                {workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
                            </p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)] hover:border-[var(--flux-brand-primary)]/30 transition-colors">
                            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                {workspaces.reduce((acc, w) => acc + w.boardCount, 0)}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                {workspaces.reduce((acc, w) => acc + w.boardCount, 0) === 1 ? 'Board' : 'Boards'}
                            </p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)] hover:border-[var(--flux-brand-primary)]/30 transition-colors">
                            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                {workspaces.reduce((acc, w) => acc + w.memberCount, 0)}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                {workspaces.reduce((acc, w) => acc + w.memberCount, 0) === 1 ? 'Member' : 'Members'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {workspaces.map((workspace, index) => (
                            <div
                                key={workspace.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <WorkspaceCard
                                    name={workspace.name}
                                    slug={workspace.slug}
                                    accentColor={workspace.accentColor}
                                    icon={workspace.icon}
                                    memberCount={workspace.memberCount}
                                    boardCount={workspace.boardCount}
                                    lastActiveAt={workspace.lastActiveAt}
                                    hasUnread={(unreadCounts[workspace.slug] ?? 0) > 0}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
