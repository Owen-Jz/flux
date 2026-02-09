import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoardBySlug } from '@/actions/board';
import { getTasks } from '@/actions/task';
import { getUserRole } from '@/actions/access-control';
import { Board } from '@/components/board';

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

    const board = await getBoardBySlug(slug, boardSlug);
    if (!board) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Board not found</h2>
                    <p className="text-[var(--text-secondary)]">This board may have been deleted or does not exist.</p>
                </div>
            </div>
        );
    }

    const tasks = await getTasks(slug, boardSlug);
    const userRole = await getUserRole(slug);

    // Determine if user can edit - only ADMIN and EDITOR can edit
    // VIEWER is read-only, non-members (public viewers) are also read-only
    const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
    const isReadOnly = !canEdit;

    return (
        <div className="h-full flex flex-col">
            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
                <Board
                    initialTasks={tasks}
                    workspaceSlug={slug}
                    boardSlug={boardSlug}
                    isReadOnly={isReadOnly}
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
                />
            </div>
        </div>
    );
}
