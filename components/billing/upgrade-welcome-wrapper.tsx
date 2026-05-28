'use client';

import { useState } from 'react';
import { UpgradeWelcomeModal } from './upgrade-welcome-modal';

interface UpgradeWelcomeWrapperProps {
    lastUpgradeAt: string | null;
    plan: string;
}

const PAID_PLANS = new Set(['starter', 'pro', 'enterprise']);

export function UpgradeWelcomeWrapper({ lastUpgradeAt, plan }: UpgradeWelcomeWrapperProps) {
    // Derive initial visibility synchronously from props so we don't
    // trigger a cascading render. The modal acts as a fallback for the
    // /billing/success page when a user closes the success tab early.
    const shouldShowInitially = Boolean(lastUpgradeAt) && PAID_PLANS.has(plan);
    const [dismissed, setDismissed] = useState(false);

    if (!shouldShowInitially || dismissed) {
        return null;
    }

    return (
        <UpgradeWelcomeModal
            plan={plan}
            onDismissed={() => setDismissed(true)}
        />
    );
}