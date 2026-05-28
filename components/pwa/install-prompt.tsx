'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: ReadonlyArray<string>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

const DISMISS_KEY = 'flux-pwa-install-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function recentlyDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = window.localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        const at = Number(raw);
        if (!Number.isFinite(at)) return false;
        return Date.now() - at < DISMISS_DURATION_MS;
    } catch {
        return false;
    }
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    // iOS-specific check
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true;
}

export function PWAInstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isStandalone() || recentlyDismissed()) return;

        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
            setVisible(true);
        };

        const onInstalled = () => {
            setVisible(false);
            setDeferred(null);
            try {
                window.localStorage.removeItem(DISMISS_KEY);
            } catch {
                // Storage unavailable — non-fatal.
            }
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    if (!visible || !deferred) return null;

    const handleInstall = async () => {
        try {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === 'dismissed') {
                try {
                    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
                } catch {
                    // Storage unavailable — non-fatal.
                }
            }
        } catch (err) {
            console.warn('[PWA] Install prompt failed:', err);
        } finally {
            setVisible(false);
            setDeferred(null);
        }
    };

    const handleDismiss = () => {
        try {
            window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            // Storage unavailable — non-fatal.
        }
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-label="Install Flux"
            className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] px-4 py-3 shadow-lg"
        >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white">
                <Download className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Install Flux</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    Get the full app experience on this device.
                </p>
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={handleInstall}
                        className="rounded-md bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                        Install
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]"
                    >
                        Not now
                    </button>
                </div>
            </div>
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
