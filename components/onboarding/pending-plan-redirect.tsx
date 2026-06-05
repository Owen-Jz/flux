'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PendingPlanRedirectProps {
    /** Slug of the workspace to send a hero visitor into so the plan gets picked up. */
    workspaceSlug: string;
}

/**
 * Bridges the post-signup gap: the marketing hero stashes the visitor's project in
 * sessionStorage (`flux_pending_plan`), but the consumer (the workspace intro
 * wrapper) only mounts on `/[slug]`, while users land on `/dashboard`. When a
 * pending plan is present, this routes them straight into their workspace so the
 * wrapper can claim it and open Plan with AI seeded with their idea.
 *
 * It deliberately does NOT remove the key — the workspace wrapper claims it — and
 * fires only when a plan is actually pending, so normal dashboard visits are
 * untouched and there's no redirect loop (the key is gone after it's claimed).
 */
export function PendingPlanRedirect({ workspaceSlug }: PendingPlanRedirectProps) {
    const router = useRouter();

    useEffect(() => {
        if (!workspaceSlug) return;
        let hasPending = false;
        try {
            hasPending = Boolean(sessionStorage.getItem('flux_pending_plan')?.trim());
        } catch {
            /* sessionStorage unavailable */
        }
        if (hasPending) {
            router.replace(`/${workspaceSlug}`);
        }
    }, [router, workspaceSlug]);

    return null;
}
