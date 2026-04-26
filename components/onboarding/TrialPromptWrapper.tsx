'use client';

import { useState, useEffect } from 'react';
import { TrialPromptModal } from './TrialPromptModal';

interface TrialPromptWrapperProps {
    trialEndsAt: string | null;
    subscriptionStatus: string | null;
    hasUsedTrial: boolean;
    trialPromptDismissedAt: string | null;
}

export function TrialPromptWrapper({
    trialEndsAt,
    subscriptionStatus,
    hasUsedTrial,
    trialPromptDismissedAt,
}: TrialPromptWrapperProps) {
    const [isEligible, setIsEligible] = useState(false);

    useEffect(() => {
        const checkEligibility = () => {
            if (!trialEndsAt || !subscriptionStatus || !hasUsedTrial) {
                setIsEligible(false);
                return;
            }

            if (trialPromptDismissedAt) {
                setIsEligible(false);
                return;
            }

            const now = new Date();
            const ends = new Date(trialEndsAt);

            if (ends <= now) {
                setIsEligible(false);
                return;
            }

            if (subscriptionStatus !== 'inactive') {
                setIsEligible(false);
                return;
            }

            setIsEligible(true);
        };

        checkEligibility();
    }, [trialEndsAt, subscriptionStatus, hasUsedTrial, trialPromptDismissedAt]);

    if (!isEligible || !trialEndsAt) {
        return null;
    }

    return <TrialPromptModal trialEndsAt={trialEndsAt} />;
}
