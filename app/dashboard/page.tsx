import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getWorkspaces } from '@/actions/workspace';
import { WorkspaceCard } from '@/components/dashboard/WorkspaceCard';
import { EmptyWorkspaces } from '@/components/dashboard/EmptyWorkspaces';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const workspaces = await getWorkspaces();

    // Empty state — no workspaces
    if (workspaces.length === 0) {
        return <EmptyWorkspaces />;
    }

    // Single workspace — redirect directly to it
    if (workspaces.length === 1) {
        redirect(`/${workspaces[0].slug}`);
    }

    const userName = session.user.name?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Decorative background pattern */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
                    style={{
                        background: 'radial-gradient(ellipse, var(--flux-brand-primary) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <p className="text-sm font-medium text-[var(--flux-brand-primary)] mb-1">
                            Dashboard
                        </p>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                            Your Workspaces
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            Welcome back, {userName}. Select a workspace to continue.
                        </p>
                    </div>

                    {/* Create Workspace Button */}
                    <Link
                        href="/onboarding"
                        className="btn btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Workspace
                    </Link>
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
                    <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)]">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{workspaces.length}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
                        </p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)]">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {workspaces.reduce((acc, w) => acc + w.boardCount, 0)}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {workspaces.reduce((acc, w) => acc + w.boardCount, 0) === 1 ? 'Board' : 'Boards'}
                        </p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-[var(--flux-surface)] border border-[var(--flux-border-subtle)]">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {workspaces.reduce((acc, w) => acc + w.memberCount, 0)}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {workspaces.reduce((acc, w) => acc + w.memberCount, 0) === 1 ? 'Member' : 'Members'}
                        </p>
                    </div>
                </div>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <WorkspaceCard
                            key={workspace.id}
                            name={workspace.name}
                            slug={workspace.slug}
                            accentColor={workspace.accentColor}
                            icon={workspace.icon}
                            memberCount={workspace.memberCount}
                            boardCount={workspace.boardCount}
                            lastActiveAt={workspace.lastActiveAt}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
