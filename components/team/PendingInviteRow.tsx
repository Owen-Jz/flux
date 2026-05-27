'use client';

import { useTransition } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cancelWorkspaceInvite } from '@/actions/workspace-invite';

export interface PendingInvite {
  id: string;
  email: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  name?: string;
  image?: string;
}

interface PendingInviteRowProps {
  invite: PendingInvite;
  isAdmin: boolean;
}

export function PendingInviteRow({ invite, isAdmin }: PendingInviteRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Cancel this invitation?')) return;
    startTransition(async () => {
      const result = await cancelWorkspaceInvite(invite.id);
      if ('error' in result) {
        alert(`Failed to cancel invitation: ${result.error}`);
      }
    });
  };

  const initials = (invite.name ?? invite.email).charAt(0).toUpperCase();

  return (
    <tr className="hover:bg-[var(--surface)] transition-colors opacity-60">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {invite.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invite.image}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {invite.name ?? invite.email}
            </p>
            {invite.name && (
              <p className="text-xs text-[var(--text-secondary)]">{invite.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          Pending
        </span>
      </td>
      {isAdmin && (
        <td className="px-6 py-4 text-right">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-2 text-[var(--error-primary)] hover:bg-[var(--error-bg)] rounded-lg transition-colors disabled:opacity-50"
            title="Cancel invitation"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
