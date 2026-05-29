'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPush, canRequestPushPermission, requiresPWAInstallForPush } from '@/lib/pwa/push-manager';

interface Props {
  workspaceId: string;
  onEnabled?: () => void;
}

const DISMISS_STORAGE_KEY = 'flux-notif-permission-dismissed-v1';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readDismissedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeDismissedAt(ts: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(ts));
  } catch {
    // Storage may be unavailable (private mode / quota). Fail silently.
  }
}

export function NotificationPermissionBanner({ workspaceId, onEnabled }: Props) {
  // Start hidden — show only after we've confirmed the user hasn't recently dismissed.
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iosInstallRequired, setIosInstallRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const needsInstall = requiresPWAInstallForPush();
    if (needsInstall) {
      const dismissedAt = readDismissedAt();
      if (dismissedAt !== null && Date.now() - dismissedAt < DISMISS_TTL_MS) {
        setVisible(false);
        return;
      }
      setIosInstallRequired(true);
      setVisible(true);
      return;
    }
    if (!canRequestPushPermission()) {
      setVisible(false);
      return;
    }
    const dismissedAt = readDismissedAt();
    if (dismissedAt !== null && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, []);

  const handleDismiss = (): void => {
    writeDismissedAt(Date.now());
    setVisible(false);
  };

  const handleEnable = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await subscribeToPush(workspaceId);
      if (result.ok) {
        onEnabled?.();
        setVisible(false);
      } else if (result.reason === 'ios-not-installed') {
        setIosInstallRequired(true);
      } else if (result.reason === 'permission-denied') {
        setErrorMessage('Permission was denied. Enable notifications in your browser settings.');
      } else {
        setErrorMessage('Could not enable notifications. Please try again.');
      }
    } catch (err) {
      console.error('[PWA] Push subscription failed:', err);
      setErrorMessage('Could not enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {iosInstallRequired ? 'Install Flux to enable notifications' : 'Get notified about task updates?'}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {iosInstallRequired
            ? 'On iPhone and iPad, push notifications only work once Flux is added to the Home Screen. Tap the Share icon in Safari, then “Add to Home Screen”.'
            : 'Enable push notifications to receive updates even when your browser is closed.'}
        </p>
        {errorMessage && (
          <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
        )}
        {!iosInstallRequired && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-[var(--text-secondary)] text-xs font-medium rounded-md hover:bg-[var(--background-subtle)]"
            >
              Not now
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification banner"
        className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-subtle)] flex-shrink-0 flex items-center justify-center"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
