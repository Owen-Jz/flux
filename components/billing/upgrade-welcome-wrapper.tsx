'use client';

import { useState, useEffect } from 'react';
import { UpgradeWelcomeModal } from './upgrade-welcome-modal';

interface UpgradeWelcomeWrapperProps {
    lastUpgradeAt: string | null;
    plan: string;
}

export function UpgradeWelcomeWrapper({ lastUpgradeAt, plan }: UpgradeWelcomeWrapperProps) {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Only show if user just upgraded (lastUpgradeAt set) AND has a paid plan (pro/enterprise)
        // Starter plan doesn't show the upgrade modal since the user already saw the trial offer
        if (lastUpgradeAt && (plan === 'pro' || plan === 'enterprise')) {
            setShowModal(true);
        }
    }, [lastUpgradeAt, plan]);

    if (!showModal) {
        return null;
    }

    return (
        <UpgradeWelcomeModal
            plan={plan}
            onDismissed={() => setShowModal(false)}
        />
    );
}