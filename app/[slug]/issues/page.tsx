import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getIssues } from '@/actions/issue';
import { getBoards } from '@/actions/board';
import { IssuesClient } from './issues-client';

interface IssuesPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function IssuesPage({ params }: IssuesPageProps) {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);

    if (!workspace) {
        notFound();
    }

    const issues = await getIssues(slug);
    const boards = await getBoards(slug);

    return (
        <IssuesClient
            workspaceSlug={slug}
            initialIssues={issues}
            workspaceName={workspace.name}
            workspaceMembers={workspace.members} // Need to pass members for assignment
            boards={boards}
        />
    );
}
