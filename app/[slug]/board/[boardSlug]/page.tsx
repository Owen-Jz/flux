import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoardBySlug } from '@/actions/board';
import { getTasks } from '@/actions/task';
import { getUserRole } from '@/actions/access-control';
import { getUnreadActivityCountForBoard, markAllActivitiesAsReadForBoard } from '@/actions/activity';
import { getOnboardingProgress } from '@/actions/onboarding';
import { Board } from '@/components/board';
import { BoardUnreadDot } from './board-unread-dot';

// Prevent caching to ensure fresh category data
export const dynamic = 'force-dynamic';

export default async function BoardPage({
    params,
}: {
    params: Promise<{ slug: string; boardSlug: string }>;
}) {
    const session = await auth();
    const { slug, boardSlug } = await params;

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

    const tasks = await getTasks(slug, boardSlug);
    const userRole = await getUserRole(slug);
    const onboardingProgress = await getOnboardingProgress();

    // Determine if user can edit - only ADMIN and EDITOR can edit
    // VIEWER is read-only, non-members (public viewers) are also read-only
    const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
    const isReadOnly = !canEdit;

    // Show interactive walkthrough if user has created board & task but hasn't completed tutorial
    const isInWalkthrough = !!(
        onboardingProgress &&
        onboardingProgress.createdFirstBoard &&
        onboardingProgress.createdFirstTask &&
        !onboardingProgress.completedTutorial
    );

    return (
        <div className="min-h-full flex flex-col">
            {/* Kanban Board */}
            <div className="flex-1 overflow-auto">
                <Board
                    initialTasks={tasks}
                    workspaceSlug={slug}
                    boardSlug={boardSlug}
                    boardId={board.id}
                    isReadOnly={isReadOnly}
                    isAdmin={userRole === 'ADMIN'}
                    members={workspace.members.map((m: any) => ({
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
