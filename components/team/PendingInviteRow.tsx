'use client';

import { useTransition } from 'react';
import { XMarkIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { cancelWorkspaceInvite } from '@/actions/workspace-invite';
import { RoleBadge } from './RoleBadge';

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

  const displayName = invite.name ?? invite.email;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="group flex items-center gap-3 px-4 md:px-5 py-3.5 transition-colors hover:bg-[var(--background-subtle)]">
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {invite.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invite.image}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover opacity-80 ring-1 ring-[var(--border-subtle)]"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-default)] bg-[var(--background-subtle)] text-sm font-semibold text-[var(--text-tertiary)]">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
          <p className="flex items-center gap-1 truncate text-xs text-[var(--text-secondary)]">
            <ClockIcon className="h-3 w-3 flex-shrink-0" />
            {invite.name ? invite.email : 'Invitation pending'}
          </p>
        </div>
      </div>

      {/* Role + status + action */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:gap-3">
        <RoleBadge role={invite.role} />
        {isAdmin && (
          <div className="flex min-w-[36px] items-center justify-end">
            <button
              onClick={handleCancel}
              disabled={isPending}
              aria-label={`Cancel invitation for ${displayName}`}
              className="rounded-lg p-2 text-[var(--text-secondary)] opacity-100 transition-colors hover:bg-[var(--background-subtle)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] hover:[color:var(--flux-error-primary)] sm:opacity-0 sm:group-hover:opacity-100"
              title="Cancel invitation"
            >
              {isPending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <XMarkIcon className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
