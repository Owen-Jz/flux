'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    SparklesIcon,
    BoltIcon,
    UsersIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { dismissTrialPrompt } from '@/actions/onboarding';

interface TrialPromptModalProps {
    trialEndsAt: string;
    onDismissed?: () => void;
}

const proFeatures = [
    { icon: BoltIcon, text: 'Unlimited boards' },
    { icon: UsersIcon, text: '25 team members' },
    { icon: StarIcon, text: 'Priority support' },
    { icon: ChartBarIcon, text: 'Advanced analytics' },
    { icon: ShieldCheckIcon, text: 'Admin controls' },
];

export function TrialPromptModal({ trialEndsAt, onDismissed }: TrialPromptModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        if (trialEndsAt) {
            const ends = new Date(trialEndsAt);
            const now = new Date();
            const diffTime = ends.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(Math.max(0, diffDays));
        }
        setIsVisible(true);
    }, [trialEndsAt]);

    const handleDismiss = async () => {
        setIsVisible(false);
        await dismissTrialPrompt();
        onDismissed?.();
    };

    const handleActivateTrial = () => {
        window.location.href = '/settings?tab=billing&action=activate-trial';
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl"
                    >
                        <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#ec4899]" />

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ec4899] shadow-lg shadow-[var(--brand-primary)]/30">
                                        <SparklesIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--foreground)]">
                                            Start your 14-day Pro trial
                                        </h2>
                                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                                    aria-label="Dismiss"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                {proFeatures.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10">
                                            <feature.icon className="w-4 h-4 text-[var(--brand-primary)]" />
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleActivateTrial}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[#ec4899] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20"
                                >
                                    Activate My Trial
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-3 bg-[var(--background-subtle)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--background-subtle)]/80 transition-colors border border-[var(--border-subtle)]"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
