import { redirect, notFound } from 'next/navigation';
import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { trackEvent } from '@/lib/track';
import { getWorkspaces, getWorkspaceBySlug } from '@/actions/workspace';
import { getBoards } from '@/actions/board';
import { getUserRole } from '@/actions/access-control';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { TutorialProvider } from '@/components/tutorial/tutorial-provider';
import { WorkspaceHeader } from '@/components/workspace-header';
import type { MemberRole } from '@/models/Workspace';
import { hexToRgb, darkenHex } from '@/lib/color';
import Link from 'next/link';

export default async function WorkspaceLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    // Check if public access is allowed
    const workspace = await getWorkspaceBySlug(slug);

    // Deleted / non-existent workspace → show the dedicated not-found state
    // (app/[slug]/not-found.tsx) instead of a silent bounce to the dashboard.
    if (!workspace) {
        notFound();
    }

    // If not logged in and not public, redirect to login
    if (!session?.user && !workspace.publicAccess) {
        redirect('/login');
    }

    // If logged in, check membership (compare strings since userId from DB is ObjectId)
    const isMember = session?.user
        ? workspace.members.some((m) => m.userId === session.user.id || m.userId.toString() === session.user.id)
        : false;

    // Determine if user is a public viewer (logged out OR not a member)
    const isPublicViewer = (!session?.user || !isMember) && workspace.publicAccess;

    // BLOCK ACCESS if private and not a member (and not public viewer)
    if (!workspace.publicAccess && !isMember) {
        redirect('/dashboard');
    }



    // First-party funnel: app opened by a real member. Collapsed to one row per
    // user per day inside trackEvent, so firing on every layout render is cheap;
    // `after()` keeps it off the response path. Public viewers are excluded.
    const trackedUserId = session?.user?.id;
    if (trackedUserId && isMember) {
        after(() => trackEvent({ event: 'app_opened', userId: trackedUserId, workspaceId: workspace.id }));
    }

    // Get user's role in the workspace
    const userRole = session?.user ? await getUserRole(slug) : null;

    const workspaces = session?.user ? await getWorkspaces() : [];
    const boards = await getBoards(slug);
    const currentWorkspace = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
    };

    const accentStyle = workspace.accentColor
        ? ({
              '--brand-primary': workspace.accentColor,
              '--brand-primary-rgb': hexToRgb(workspace.accentColor),
              '--brand-primary-hover': darkenHex(workspace.accentColor),
          } as React.CSSProperties)
        : undefined;

    return (
        <div
            id="workspace-shell"
            className="flex flex-col md:flex-row h-screen bg-[var(--background)]"
            style={accentStyle}
        >
            <TutorialProvider />
            {/* Only show sidebar for authenticated users */}
            {session?.user && (
                <>
                    <div className="hidden md:block h-full flex-shrink-0">
                        <Sidebar
                            workspaces={workspaces}
                            currentWorkspace={currentWorkspace}
                            boards={boards}
                            userRole={userRole}
                            user={session.user}
                        />
                    </div>
                    <MobileNav
                        workspaces={workspaces}
                        currentWorkspace={currentWorkspace}
                        boards={boards}
                        userRole={userRole}
                        user={session.user}
                    />
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
                {/* Note: WorkspaceHeader moved to individual pages with integrated navigation */}

                {/* Public viewer banner */}
                {isPublicViewer && (
                    <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary,var(--brand-primary))] text-white shadow-md z-50 flex-shrink-0">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-medium">
                                <span>👋 You are viewing <strong>{workspace.name}</strong> as a guest.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium hover:text-white/90 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-1.5 bg-white text-[var(--brand-primary)] rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Sign Up Free
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
