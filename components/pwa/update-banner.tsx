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

  if (!visible) return null;

  const handleRefresh = async () => {
    const { applyUpdate } = await import('@/lib/pwa/sw-register');
    await applyUpdate();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--surface)] border border-[var(--border-default)] shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
      <RefreshCw className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
      <p className="text-sm text-[var(--text-primary)]">
        A new version is available.{' '}
        <button
          onClick={handleRefresh}
          className="font-medium text-[var(--brand-primary)] hover:underline"
        >
          Refresh
        </button>{' '}
        to update.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
