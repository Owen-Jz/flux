'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

function subscribeOnline(callback: () => void) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
}

function getOnlineSnapshot(): boolean {
    return navigator.onLine;
}

function getServerSnapshot(): boolean {
    return true;
}

export function OfflinePageClient() {
    const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot);

    // Auto-reload the moment the network returns — the page below this is what
    // the user actually wanted to see.
    useEffect(() => {
        const handler = () => window.location.reload();
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-lg ring-1 ring-[var(--border-subtle)]">
                    <CloudOff className="h-8 w-8 text-[var(--brand-primary)]" aria-hidden="true" />
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    You&apos;re offline
                </h1>

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Flux needs a network connection to load this page. Once you&apos;re back online, the
                    page will reload automatically.
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span
                        className={`h-2 w-2 rounded-full ${
                            isOnline ? 'bg-[var(--success-primary)]' : 'bg-[var(--text-tertiary)]'
                        }`}
                        aria-hidden="true"
                    />
                    <span>{isOnline ? 'Connection restored' : 'No network detected'}</span>
                </div>

                <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        </main>
    );
}
