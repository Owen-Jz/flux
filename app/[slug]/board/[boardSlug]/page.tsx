import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { InformationCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 pt-3 pb-1 flex-shrink-0 flex-wrap">
            {/* Top-bar breadcrumb: makes the board you're currently on explicit, with
                the board's own colour and a brand-accent highlight. */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
                <Link
                    href={`/${slug}`}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors truncate max-w-[30vw] md:max-w-none"
                >
                    {workspace.name}
                </Link>
                <ChevronRightIcon className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" aria-hidden="true" />
                <span
                    aria-current="page"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(var(--brand-primary-rgb),0.1)] border border-[rgba(var(--brand-primary-rgb),0.25)] min-w-0"
                >
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-[var(--background)]"
                        style={{ backgroundColor: board.color }}
                    />
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">{board.name}</span>
                </span>
            </nav>
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
                    title={`${board.name}'s own calendar — separate from every other board`}
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
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                            <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--brand-primary)]" />
                            <span>
                                Each board has its own calendar. Anything you schedule here belongs to{' '}
                                <span className="font-medium text-[var(--foreground)]">{board.name}</span> only — it
                                won&apos;t appear on other boards&apos; calendars or the workspace calendar.
                            </span>
                        </div>
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
