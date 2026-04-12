'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPush, canRequestPushPermission } from '@/lib/pwa/push-manager';

interface Props {
  workspaceId: string;
  onEnabled?: () => void;
}

export function NotificationPermissionBanner({ workspaceId, onEnabled }: Props) {
  const [visible, setVisible] = useState(true);

  if (!canRequestPushPermission()) return null;

  const handleEnable = async () => {
    try {
      await subscribeToPush(workspaceId);
      onEnabled?.();
      setVisible(false);
    } catch (err) {
      console.error('[PWA] Push subscription failed:', err);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Get notified about task updates?
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Enable push notifications to receive updates even when your browser is closed.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-medium rounded-md hover:opacity-90"
          >
            Enable
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 text-[var(--text-secondary)] text-xs font-medium rounded-md hover:bg-[var(--background-subtle)]"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
