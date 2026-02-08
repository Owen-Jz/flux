import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getAccessRequests, getUserRole, hasPendingRequest } from '@/actions/access-control';
import { Users } from 'lucide-react';
import InviteButton from '@/components/InviteButton';
import { TeamClient } from './team-client';
import { RequestAccessButton } from '@/components/RequestAccessButton';
import { MemberRow } from '@/components/team/MemberRow';

export default async function TeamPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);
    const userRole = await getUserRole(slug);
    const accessRequests = await getAccessRequests(slug);
    const hasPending = await hasPendingRequest(slug);

    if (!workspace) return null;

    const isAdmin = userRole === 'ADMIN';
    const isViewer = userRole === 'VIEWER' || (!userRole && workspace.publicAccess);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Team</h1>
                    <p className="text-[var(--text-secondary)]">Manage your workspace collaborators</p>
                </div>
                <div className="flex items-center gap-2">
                    {isViewer && !hasPending && session?.user && (
                        <RequestAccessButton slug={slug} />
                    )}
                    {isViewer && hasPending && (
                        <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200">
                            Request Pending
                        </div>
                    )}
                    {isAdmin && <InviteButton slug={slug} />}
                </div>
            </div>

            {/* Pending Access Requests - Only visible to admin */}
            {isAdmin && accessRequests.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-xs font-bold">
                            {accessRequests.length}
                        </span>
                        Pending Access Requests
                    </h2>
                    <TeamClient
                        accessRequests={accessRequests}
                        slug={slug}
                    />
                </div>
            )}

            <div className="card overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
                            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Member</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Role</th>
                            {isAdmin && (
                                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {workspace.members.map((member) => (
                            <MemberRow
                                key={member.userId}
                                member={member}
                                slug={slug}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-[var(--brand-primary)] text-white">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--brand-primary)]">Collaboration is key</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {isAdmin
                                ? 'Invite your teammates to start assigning tasks and tracking progress together in real-time.'
                                : 'Request edit access to collaborate on tasks and contribute to the project.'}
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
