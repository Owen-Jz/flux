import { notFound } from 'next/navigation';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getIssues } from '@/actions/issue';
import { IssuesClient } from './issues-client';

interface IssuesPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function IssuesPage({ params }: IssuesPageProps) {
    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);

    if (!workspace) {
        notFound();
    }

    const issues = await getIssues(slug);

    return (
        <IssuesClient 
            workspaceSlug={slug} 
            initialIssues={issues} 
            workspaceName={workspace.name}
            workspaceMembers={workspace.members} // Need to pass members for assignment
        />
    );
}
