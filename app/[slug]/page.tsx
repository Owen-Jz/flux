import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoards } from '@/actions/board';
import { getUserRole, hasPendingRequest } from '@/actions/access-control';
import Link from 'next/link';
import { LayoutGrid, Plus, ArrowRight, Eye } from 'lucide-react';
import { RequestAccessButton } from '@/components/RequestAccessButton';

export default async function WorkspacePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-[var(--text-secondary)]">Workspace not found</p>
            </div>
        );
    }

    const boards = await getBoards(slug);
    const userRole = await getUserRole(slug);
    const hasPending = session?.user ? await hasPendingRequest(slug) : false;

    // Determine user's access level
    const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
    const isViewer = userRole === 'VIEWER' || (!userRole && workspace.publicAccess);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{workspace.name}</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-[var(--text-secondary)]">
                            {boards.length} board{boards.length !== 1 ? 's' : ''} in this workspace
                        </p>
                        {userRole && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${userRole === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : userRole === 'EDITOR'
                                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {userRole}
                            </span>
                        )}
                    </div>
                </div>

                {/* Request Edit Access button for viewers */}
                {isViewer && !hasPending && session?.user && (
                    <RequestAccessButton slug={slug} />
                )}
                {isViewer && hasPending && (
                    <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Request Pending
                    </div>
                )}
            </div>

            {boards.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 mb-6">
                        <LayoutGrid className="w-8 h-8 text-[var(--brand-primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No boards yet</h2>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                        {canEdit
                            ? 'Create your first board to start organizing tasks. Boards help you categorize your work by project, team, or department.'
                            : 'This workspace doesn\'t have any boards yet. The workspace admin can create boards to start organizing tasks.'}
                    </p>
                    {canEdit && (
                        <p className="text-sm text-[var(--text-secondary)]">
                            Click the <Plus className="w-4 h-4 inline-block mx-1" /> button in the sidebar to create a board.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boards.map((board) => (
                        <Link
                            key={board.id}
                            href={`/${slug}/board/${board.slug}`}
                            className="group card p-5 hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: board.color }}
                                >
                                    <LayoutGrid className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--brand-primary)] transition-colors truncate">
                                        {board.name}
                                    </h3>
                                    {board.description && (
                                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                                            {board.description}
                                        </p>
                                    )}
                                </div>
                                <ArrowRight className="w-5 h-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
