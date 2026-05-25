'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    SparklesIcon,
    CheckIcon,
    BoltIcon,
    UsersIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { dismissUpgradeWelcome } from '@/actions/billing/dismiss-upgrade-welcome';

interface UpgradeWelcomeModalProps {
    plan: string;
    onDismissed?: () => void;
}

const planLabels: Record<string, string> = {
    starter: 'Individual',
    pro: 'Pro',
    enterprise: 'Business',
};

const planFeatures: Record<string, Array<{ icon: typeof BoltIcon; text: string }>> = {
    starter: [
        { icon: BoltIcon, text: '5 projects' },
        { icon: UsersIcon, text: '10 team members' },
        { icon: ChartBarIcon, text: 'Email support' },
        { icon: ShieldCheckIcon, text: 'Custom workflows' },
    ],
    pro: [
        { icon: BoltIcon, text: 'Unlimited projects' },
        { icon: UsersIcon, text: '25 team members' },
        { icon: SparklesIconSolid, text: 'Priority support' },
        { icon: ChartBarIcon, text: 'Advanced analytics' },
    ],
    enterprise: [
        { icon: BoltIcon, text: 'Unlimited everything' },
        { icon: UsersIcon, text: 'Unlimited members' },
        { icon: ShieldCheckIcon, text: 'SSO & SLA guarantee' },
        { icon: GiftIcon, text: 'Dedicated success manager' },
    ],
};

export function UpgradeWelcomeModal({ plan, onDismissed }: UpgradeWelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleDismiss = async () => {
        setIsVisible(false);
        await dismissUpgradeWelcome();
        onDismissed?.();
    };

    const features = planFeatures[plan] || planFeatures['pro'];
    const planLabel = planLabels[plan] || plan;

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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl"
                    >
                        {/* Gradient header */}
                        <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

                        <div className="p-6">
                            {/* Top section with badge and dismiss */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                                        <SparklesIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
                                                {planLabel.toUpperCase()}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-[var(--foreground)] mt-1">
                                            Upgrade successful!
                                        </h2>
                                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                            Welcome to the {planLabel} plan
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

                            {/* Features list */}
                            <div className="space-y-3 mb-6">
                                <p className="text-sm font-medium text-[var(--text-secondary)]">
                                    Your new features include:
                                </p>
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                                            <feature.icon className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA button */}
                            <button
                                onClick={handleDismiss}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                            >
                                <SparklesIconSolid className="w-4 h-4" />
                                Start exploring
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}