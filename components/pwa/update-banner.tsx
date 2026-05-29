'use client';

import { useState, useEffect } from 'react';
import { onUpdateAvailable } from '@/lib/pwa/sw-register';
import { X, RefreshCw } from 'lucide-react';

export function PWAUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cleanup = onUpdateAvailable(() => setVisible(true));
    return cleanup;
  }, []);

  const handleRefresh = async (): Promise<void> => {
    const { applyUpdate } = await import('@/lib/pwa/sw-register');
    await applyUpdate();
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 mx-4 max-w-[calc(100vw-2rem)] w-full sm:max-w-sm bg-[var(--surface)] border border-[var(--border-default)] shadow-lg rounded-lg px-3 py-3 flex items-center gap-2 sm:gap-3"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <RefreshCw className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
      <p className="text-sm text-[var(--text-primary)] flex-1 min-w-0">
        A new version is available.
      </p>
      <button
        onClick={handleRefresh}
        className="px-3 py-1.5 min-h-[36px] bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-md hover:opacity-90 transition-opacity flex-shrink-0"
      >
        Refresh
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss update banner"
        className="p-2 min-h-[40px] min-w-[40px] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-subtle)] flex-shrink-0 flex items-center justify-center"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
