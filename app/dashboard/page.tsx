import { redirect } from 'next/navigation';
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

    const userName = session.user.name?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        Your Workspaces
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Welcome back, {userName}. Select a workspace to continue.
                    </p>
                </div>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {workspaces.map((workspace) => (
                        <WorkspaceCard
                            key={workspace.id}
                            name={workspace.name}
                            slug={workspace.slug}
                            accentColor={workspace.accentColor}
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
