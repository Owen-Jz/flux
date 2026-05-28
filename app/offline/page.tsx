import type { Metadata } from 'next';
import { OfflinePageClient } from './offline-client';

export const metadata: Metadata = {
    title: "You're offline — Flux",
    description: 'Flux is currently offline. Reconnect to continue.',
    robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

export default function OfflinePage() {
    return <OfflinePageClient />;
}
