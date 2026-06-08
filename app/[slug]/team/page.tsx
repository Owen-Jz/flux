import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getAccessRequests, getUserRole, hasPendingRequest } from '@/actions/access-control';
import { UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import InviteButton from '@/components/InviteButton';
import { TeamClient } from './team-client';
import { RequestAccessButton } from '@/components/RequestAccessButton';
import { MemberRow } from '@/components/team/MemberRow';
import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { User } from '@/models/User';
import { PendingInviteRow, type PendingInvite } from '@/components/team/PendingInviteRow';

export default async function TeamPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        notFound();
    }

    // Allow logged-out visitors only on public workspaces; otherwise → login.
    // Guests and logged-in non-members get a read-only roster: getUserRole returns
    // null (so isAdmin is false → no invite/manage controls), getAccessRequests and
    // hasPendingRequest return empty/false, and RequestAccessButton is gated on session.
    if (!session?.user && !workspace.publicAccess) {
        redirect('/login');
    }

    const userRole = await getUserRole(slug);
    const accessRequests = await getAccessRequests(slug);
    const hasPending = await hasPendingRequest(slug);

    const isAdmin = userRole === 'ADMIN';
    const isViewer = userRole === 'VIEWER' || (!userRole && workspace.publicAccess);

    // Fetch pending invites for this workspace
    await connectDB();
    const rawInvites = await WorkspaceInvite.find({ workspaceSlug: slug, requiresAcceptance: true }).lean();

    const inviteEmails = rawInvites.map((i) => i.email);
    const matchedUsers = inviteEmails.length > 0
      ? await User.find({ email: { $in: inviteEmails } }).select('email name image').lean()
      : [];
    const userByEmail = new Map(matchedUsers.map((u) => [u.email as string, u]));

    const pendingInvites: PendingInvite[] = rawInvites.map((invite) => {
      const matched = userByEmail.get(invite.email);
      return {
        id: (invite._id as { toString(): string }).toString(),
        email: invite.email,
        role: invite.role as 'VIEWER' | 'EDITOR' | 'ADMIN',
        name: matched?.name as string | undefined,
        image: matched?.image as string | undefined,
      };
    });

    const memberCount = workspace.members.length;

    return (
        <div className="mx-auto max-w-4xl overflow-x-hidden p-4 md:p-8">
            {/* Page header */}
            <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center md:mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                        <UsersIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Team</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Manage your workspace collaborators</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isViewer && !hasPending && session?.user && (
                        <RequestAccessButton slug={slug} />
                    )}
                    {isViewer && hasPending && (
                        <div
                            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium"
                            style={{
                                background: 'var(--flux-warning-bg)',
                                color: 'var(--flux-warning-text-strong)',
                                borderColor: 'var(--flux-warning-border)',
                            }}
                        >
                            <ClockIcon className="h-4 w-4" />
                            Request pending
                        </div>
                    )}
                    {isAdmin && <InviteButton slug={slug} />}
                </div>
            </header>

            {/* Pending Access Requests - Only visible to admin */}
            {isAdmin && accessRequests.length > 0 && (
                <section className="mb-6 md:mb-8">
                    <div className="mb-3 flex items-center gap-2.5 px-1">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            Access Requests
                        </h2>
                        <span
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                            style={{ background: 'var(--flux-warning-primary)' }}
                        >
                            {accessRequests.length}
                        </span>
                    </div>
                    <TeamClient accessRequests={accessRequests} slug={slug} />
                </section>
            )}

            {/* Members + pending invites */}
            <section>
                <div className="mb-3 flex items-center gap-2.5 px-1">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                        Members
                    </h2>
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--background-subtle)] px-1.5 text-xs font-bold text-[var(--text-secondary)]">
                        {memberCount}
                    </span>
                </div>

                <div className="card overflow-hidden">
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {workspace.members.map((member) => (
                            <MemberRow
                                key={member.userId}
                                member={member}
                                slug={slug}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>

                    {pendingInvites.length > 0 && (
                        <>
                            <div className="border-t border-[var(--border-subtle)] bg-[var(--background-subtle)]/60 px-4 py-2 md:px-5">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                    Pending invitations · {pendingInvites.length}
                                </span>
                            </div>
                            <div className="divide-y divide-[var(--border-subtle)]">
                                {pendingInvites.map((invite) => (
                                    <PendingInviteRow
                                        key={invite.id}
                                        invite={invite}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer CTA */}
            <div className="mt-6 rounded-2xl border border-[var(--brand-primary)]/15 bg-[var(--brand-primary)]/5 p-4 md:mt-8 md:p-6">
                <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-[var(--brand-primary)] p-2 text-white">
                        <UsersIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--brand-primary)]">Collaboration is key</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {isAdmin
                                ? 'Invite your teammates to start assigning tasks and tracking progress together in real-time.'
                                : 'Request edit access to collaborate on tasks and contribute to the project.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
