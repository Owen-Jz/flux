import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getIssues } from '@/actions/issue';
import { getBoards } from '@/actions/board';
import { getUserRole } from '@/actions/access-control';
import { IssuesClient } from './issues-client';

interface IssuesPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function IssuesPage({ params }: IssuesPageProps) {
    const session = await auth();
    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);

    if (!workspace) {
        notFound();
    }

    // Allow logged-out visitors only on public workspaces; otherwise → login.
    if (!session?.user && !workspace.publicAccess) {
        redirect('/login');
    }

    // Guests and non-members have no role → read-only. Only ADMIN/EDITOR may edit
    // feedback; VIEWERs and guests get a view-only list with no mutating controls.
    const userRole = await getUserRole(slug);
    const isReadOnly = userRole !== 'ADMIN' && userRole !== 'EDITOR';

    const issues = await getIssues(slug);
    const boards = await getBoards(slug);

    return (
        <IssuesClient
            workspaceSlug={slug}
            initialIssues={issues}
            workspaceName={workspace.name}
            workspaceMembers={workspace.members} // Need to pass members for assignment
            boards={boards}
            isReadOnly={isReadOnly}
        />
    );
}
