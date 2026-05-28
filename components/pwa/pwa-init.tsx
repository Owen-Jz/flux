'use client';

import { useEffect } from 'react';
import { setupOfflineSync } from '@/lib/pwa/sw-register';

export function PWAInit() {
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        const cleanupOfflineSync = setupOfflineSync();

        navigator.serviceWorker
            .register('/sw.js')
            .catch((err) => console.warn('SW registration failed:', err));

        return () => {
            cleanupOfflineSync();
        };
    }, []);

    return null;
}
