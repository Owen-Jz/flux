import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoardBySlug } from '@/actions/board';
import { getTasks, getBoardCalendarTasks } from '@/actions/task';
import { getUserRole } from '@/actions/access-control';
import { getOnboardingProgress } from '@/actions/onboarding';
import { Board } from '@/components/board';
import { CalendarClient } from '@/components/calendar/CalendarClient';
import { BoardUnreadDot } from './board-unread-dot';

// Prevent caching to ensure fresh category data
export const dynamic = 'force-dynamic';

export default async function BoardPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string; boardSlug: string }>;
    searchParams: Promise<{ view?: string }>;
}) {
    const session = await auth();
    const { slug, boardSlug } = await params;
    const view = (await searchParams).view === 'calendar' ? 'calendar' : 'board';

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-[var(--text-secondary)]">Workspace not found</p>
            </div>
        );
    }

    // Logged-out visitors are allowed only when the workspace is public; otherwise
    // send them to login. Logged-in non-members of a public workspace are NOT
    // bounced — they fall through to the read-only guest view (userRole is null →
    // canEdit false). Logged-in non-members of a private workspace are blocked by
    // the workspace layout before reaching here.
    if (!session?.user && !workspace.publicAccess) {
        redirect('/login');
    }

    const board = await getBoardBySlug(slug, boardSlug);
    if (!board) {
        notFound();
    }

    const userRole = await getUserRole(slug);

    // Determine if user can edit - only ADMIN and EDITOR can edit
    // VIEWER is read-only, non-members (public viewers) are also read-only
    const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
    const isReadOnly = !canEdit;

    // Each board has two views: the kanban board (default) and its own calendar,
    // which positions tasks by `scheduledDate` and is isolated from the workspace
    // calendar. The active view is driven by ?view= so it's refresh-safe + shareable.
    const tabBase = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors';
    const tabActive = 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm';
    const tabIdle = 'text-[var(--text-secondary)] hover:text-[var(--foreground)]';

    const viewToggle = (
        <div className="flex items-center gap-1 px-4 md:px-6 pt-3 pb-1 flex-shrink-0">
            <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                <Link
                    href={`/${slug}/board/${boardSlug}`}
                    aria-current={view === 'board' ? 'page' : undefined}
                    className={`${tabBase} ${view === 'board' ? tabActive : tabIdle}`}
                >
                    Board
                </Link>
                <Link
                    href={`/${slug}/board/${boardSlug}?view=calendar`}
                    aria-current={view === 'calendar' ? 'page' : undefined}
                    className={`${tabBase} ${view === 'calendar' ? tabActive : tabIdle}`}
                >
                    Calendar
                </Link>
            </div>
        </div>
    );

    if (view === 'calendar') {
        const calendarTasks = await getBoardCalendarTasks(slug, boardSlug);

        return (
            <div className="min-h-full flex flex-col">
                {viewToggle}
                <div className="flex-1 overflow-auto px-4 md:px-6 pb-6 flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{board.name} calendar</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Items scheduled on this board only</p>
                    </div>
                    <CalendarClient
                        initialTasks={calendarTasks}
                        workspaceSlug={slug}
                        userRole={userRole}
                        dateField="scheduledDate"
                        boards={[{
                            id: board.id,
                            name: board.name,
                            slug: boardSlug,
                            description: board.description,
                            color: board.color,
                        }]}
                        members={workspace.members.map((m) => ({
                            id: m.userId,
                            name: m.user?.name || 'Unknown User',
                            email: m.user?.email || '',
                            image: m.user?.image,
                        }))}
                    />
                </div>
            </div>
        );
    }

    const tasks = await getTasks(slug, boardSlug);
    const onboardingProgress = await getOnboardingProgress();

    // Show interactive walkthrough if user has created board & task but hasn't completed tutorial
    const isInWalkthrough = !!(
        onboardingProgress &&
        onboardingProgress.createdFirstBoard &&
        onboardingProgress.createdFirstTask &&
        !onboardingProgress.completedTutorial
    );

    return (
        <div className="min-h-full flex flex-col">
            {viewToggle}
            {/* Kanban Board */}
            <div className="flex-1 overflow-auto">
                <Board
                    initialTasks={tasks}
                    workspaceSlug={slug}
                    boardSlug={boardSlug}
                    boardId={board.id}
                    isReadOnly={isReadOnly}
                    isAdmin={userRole === 'ADMIN'}
                    members={workspace.members.map((m) => ({
                        id: m.userId,
                        name: m.user?.name || 'Unknown User',
                        email: m.user?.email || '',
                        image: m.user?.image,
                        role: m.role,
                    }))}
                    boardName={board.name}
                    boardDescription={board.description}
                    boardColor={board.color}
                    categories={board.categories}
                    currentUserId={session?.user?.id}
                    hasUnread={<BoardUnreadDot workspaceSlug={slug} boardSlug={boardSlug} />}
                    isInWalkthrough={isInWalkthrough}
                />
            </div>
        </div>
    );
}
