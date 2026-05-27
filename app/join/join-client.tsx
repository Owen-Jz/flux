'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptWorkspaceInvite } from '@/actions/workspace-invite';

interface JoinClientProps {
  token: string;
  workspaceName: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
}

export function JoinClient({ token, workspaceName, role }: JoinClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    startTransition(async () => {
      const result = await acceptWorkspaceInvite(token);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/${result.workspaceSlug}`);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl p-8 shadow-lg border border-[var(--border-subtle)] text-center">
        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white font-bold text-sm mb-6">
          flux
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Join {workspaceName}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          You&apos;ve been invited to join <strong>{workspaceName}</strong> as{' '}
          <strong>{role}</strong>.
        </p>
        {error && (
          <p className="text-sm text-[var(--error-primary)] mb-4 bg-[var(--error-bg)] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          onClick={handleJoin}
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Joining…' : `Join ${workspaceName}`}
        </button>
      </div>
    </div>
  );
}
