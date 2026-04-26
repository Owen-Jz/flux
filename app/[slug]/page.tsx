import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getBoards } from '@/actions/board';
import { getUserRole, hasPendingRequest } from '@/actions/access-control';
import { getUnreadActivityCount, markAllActivitiesAsRead } from '@/actions/activity';
import Link from 'next/link';
import { Squares2X2Icon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { RequestAccessButton } from '@/components/RequestAccessButton';
import BoardGrid from '@/components/BoardGrid';
import { WorkspaceUnreadDot } from './workspace-unread-dot';
import { ReferralPromptWrapper } from '@/components/onboarding/referral-prompt-wrapper';

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
        <>
            <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto overflow-x-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2 tracking-tight">
                        {workspace.name}
                        <WorkspaceUnreadDot workspaceSlug={slug} />
                    </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm text-[var(--text-secondary)]">
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
                            <EyeIcon className="w-4 h-4" />
                            Request Pending
                        </div>
                    )}
                </div>

                <BoardGrid workspaceSlug={slug} initialBoards={boards} canEdit={canEdit} />
            </div>
            <ReferralPromptWrapper workspaceSlug={slug} />
        </>
    );
}
