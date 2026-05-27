import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { JoinClient } from './join-client';

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl p-8 shadow-lg border border-[var(--border-subtle)] text-center">
        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white font-bold text-sm mb-6">
          flux
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Invite unavailable</h1>
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      </div>
    </div>
  );
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorScreen message="Invalid invite link. Please ask the workspace admin to send a new invitation." />;
  }

  await connectDB();

  const invite = await WorkspaceInvite.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean() as { email: string; workspaceName: string; role: 'VIEWER' | 'EDITOR' | 'ADMIN' } | null;

  if (!invite) {
    return <ErrorScreen message="This invite link is invalid or has expired. Please ask the workspace admin to send a new invitation." />;
  }

  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/join?token=${token}`)}`);
  }

  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <ErrorScreen
        message={`This invite was sent to ${invite.email}. Please sign in with that account to continue.`}
      />
    );
  }

  return (
    <JoinClient
      token={token}
      workspaceName={invite.workspaceName}
      role={invite.role}
    />
  );
}
