'use client';

import { useState, useEffect, useRef } from 'react';
import { TrialPromptModal } from './TrialPromptModal';
import { startTrial } from '@/actions/billing/start-trial';
import { dismissTrialPrompt, isEligibleForOnboarding } from '@/actions/onboarding';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const [isEligible, setIsEligible] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isOnboardingEligible, setIsOnboardingEligible] = useState(false);
    const justActivatedRef = useRef(false);

    // Handle client-side mounting
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Check if user is eligible for onboarding (in their 7-day onboarding window)
        // If so, skip the trial offer and let the onboarding checklist guide them first
        const checkOnboardingStatus = async () => {
            try {
                const eligible = await isEligibleForOnboarding();
                setIsOnboardingEligible(eligible);
            } catch (error) {
                console.error('Failed to check onboarding eligibility:', error);
            }
        };
        checkOnboardingStatus();
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted) return;

        const justActivated = justActivatedRef.current;
        console.log('[TrialPrompt] Mounted with props:', {
            trialEndsAt,
            subscriptionStatus,
            hasUsedTrial,
            trialPromptDismissedAt,
            justActivated
        });

        const checkEligibility = () => {
            console.log('[TrialPrompt] Checking eligibility:', {
                trialEndsAt,
                subscriptionStatus,
                hasUsedTrial,
                trialPromptDismissedAt,
                showOfferModal,
                isEligible,
                isOnboardingEligible
            });

            // Skip if we just activated the trial - don't show reminder modal immediately
            if (justActivatedRef.current) {
                justActivatedRef.current = false;
                return;
            }

            // If user is in their onboarding window (7 days, not dismissed), skip trial offer
            // Let the onboarding checklist guide them first before showing trial
            if (isOnboardingEligible) {
                console.log('[TrialPrompt] Skipping trial offer - user is in onboarding window');
                return;
            }

            // For users with active trial (hasUsedTrial && trialEndsAt set && status inactive)
            // Show the trial reminder modal
            if (trialEndsAt && subscriptionStatus === 'inactive' && hasUsedTrial && !trialPromptDismissedAt) {
                const now = new Date();
                const ends = new Date(trialEndsAt);
                if (ends > now) {
                    console.log('[TrialPrompt] Showing reminder modal (active trial)');
                    setIsEligible(true);
                    return;
                }
            }

            // For new users without trial AND not in onboarding window AND not yet dismissed - show trial offer
            // hasUsedTrial is false means no trial has been given
            // subscriptionStatus must be inactive (trial users, not active paying users)
            // trialPromptDismissedAt ensures we only show once
            if (!hasUsedTrial && subscriptionStatus !== 'active' && !trialPromptDismissedAt) {
                console.log('[TrialPrompt] Showing offer modal (no trial yet, not dismissed)');
                setShowOfferModal(true);
                return;
            }
        };

        checkEligibility();
    }, [isMounted, trialEndsAt, subscriptionStatus, hasUsedTrial, trialPromptDismissedAt, isOnboardingEligible]);

    const handleActivateTrial = async () => {
        setIsProcessing(true);
        try {
            const result = await startTrial('pro');
            if (result.success) {
                setShowOfferModal(false);
                justActivatedRef.current = true;
                router.refresh();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDismissOffer = async () => {
        // Persist the dismissal to prevent showing again
        await dismissTrialPrompt();
        setShowOfferModal(false);
    };

    // Show trial reminder for users who already have a trial
    if (isEligible && trialEndsAt) {
        return <TrialPromptModal trialEndsAt={trialEndsAt} />;
    }

    // Show trial offer modal for new users without trial
    if (showOfferModal) {
        return (
            <TrialOfferModal
                onActivate={handleActivateTrial}
                onDismiss={handleDismissOffer}
                isProcessing={isProcessing}
            />
        );
    }

    return null;
}

interface TrialOfferModalProps {
    onActivate: () => void;
    onDismiss: () => void;
    isProcessing: boolean;
}

function TrialOfferModal({ onActivate, onDismiss, isProcessing }: TrialOfferModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl">
                <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#ec4899]" />
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ec4899] shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">
                                Start your free trial
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                14 days of Pro features
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        {['Unlimited projects', '25 team members', 'Priority support', 'Advanced analytics'].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-sm">
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[var(--text-secondary)]">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onActivate}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[#ec4899] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                        >
                            {isProcessing ? 'Activating...' : 'Start Free Trial'}
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-4 py-3 bg-[var(--background-subtle)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--background-subtle)]/80 transition-colors border border-[var(--border-subtle)]"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
