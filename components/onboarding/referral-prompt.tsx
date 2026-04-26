'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    UserPlusIcon,
    SparklesIcon,
    ArrowPathIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { shouldShowReferralPrompt, markReferralPromptShown } from '@/actions/onboarding';
import InviteMemberModal from '@/components/InviteMemberModal';

interface ReferralPromptProps {
    workspaceSlug: string;
}

export function ReferralPrompt({ workspaceSlug }: ReferralPromptProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        checkReferralPrompt();
    }, []);

    const checkReferralPrompt = async () => {
        try {
            const shouldShow = await shouldShowReferralPrompt();
            if (shouldShow) {
                setIsVisible(true);
            }
        } catch (error) {
            console.error('Failed to check referral prompt:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = async () => {
        setIsDismissed(true);
        setIsVisible(false);
        // Mark as shown so we don't show again
        await markReferralPromptShown();
    };

    const handleInviteClick = () => {
        setShowInviteModal(true);
        setIsVisible(false);
        // Mark as shown immediately when they choose to invite
        markReferralPromptShown();
    };

    // Don't render if dismissed or still loading
    if (isDismissed || isLoading) {
        return null;
    }

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed bottom-6 right-6 z-40 max-w-sm"
                    >
                        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 relative overflow-hidden">
                            {/* Decorative gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#ec4899]" />

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                                aria-label="Dismiss"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>

                            {/* Content */}
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ec4899] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--brand-primary)]/30">
                                    <UserPlusIcon className="w-6 h-6 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                        <h3 className="text-base font-bold text-[var(--foreground)]">
                                            Invite Your Team
                                        </h3>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                                        You&apos;re up and running! Bring your teammates on board to collaborate and get more done together.
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleInviteClick}
                                            className="flex-1 px-4 py-2.5 bg-[var(--brand-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 flex items-center justify-center gap-2"
                                        >
                                            <UserPlusIcon className="w-4 h-4" />
                                            Invite Teammates
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Subtle footer text */}
                            <p className="mt-4 text-xs text-[var(--text-tertiary)] text-center">
                                Collaboration makes everything better
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteMemberModal
                    slug={workspaceSlug}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </>
    );
}