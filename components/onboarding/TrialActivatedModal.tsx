'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface TrialActivatedModalProps {
    trialEndsAt: string;
    onClose: () => void;
}

const PRO_FEATURES = [
    { icon: '∞', label: 'Unlimited boards & projects' },
    { icon: '👥', label: '25 team members per workspace' },
    { icon: '📊', label: 'Advanced analytics & reporting' },
    { icon: '🔑', label: 'API access & webhooks' },
    { icon: '⚡', label: 'Priority support' },
    { icon: '🛡️', label: 'Admin controls & audit logs' },
];

export function TrialActivatedModal({ trialEndsAt, onClose }: TrialActivatedModalProps) {
    const firedRef = useRef(false);

    const expiryLabel = new Date(trialEndsAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    useEffect(() => {
        if (firedRef.current) return;
        firedRef.current = true;

        // Initial burst from center
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { x: 0.5, y: 0.55 },
            colors: ['#7c3aed', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
            startVelocity: 45,
            gravity: 0.9,
            ticks: 200,
        });

        // Side cannons after a brief pause
        const t1 = setTimeout(() => {
            confetti({
                particleCount: 60,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.65 },
                colors: ['#7c3aed', '#ec4899', '#f59e0b'],
            });
            confetti({
                particleCount: 60,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.65 },
                colors: ['#7c3aed', '#ec4899', '#f59e0b'],
            });
        }, 300);

        return () => clearTimeout(t1);
    }, []);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.75, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                    className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[var(--surface)] shadow-2xl"
                >
                    {/* Top gradient bar */}
                    <div className="h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-purple-400 to-[#ec4899]" />

                    {/* Glow blob behind icon */}
                    <div
                        className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-20 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
                            filter: 'blur(32px)',
                        }}
                    />

                    <div className="relative p-8 text-center">
                        {/* Animated icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
                            className="mx-auto mb-5 w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ec4899] flex items-center justify-center shadow-xl"
                        >
                            <motion.svg
                                className="w-10 h-10 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </motion.svg>
                        </motion.div>

                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <p className="text-[var(--brand-primary)] font-semibold text-sm uppercase tracking-widest mb-1">
                                Trial Activated
                            </p>
                            <h2 className="text-2xl font-extrabold text-[var(--foreground)] leading-tight mb-1">
                                You&apos;re on Pro!
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                14 days free &mdash; expires <strong>{expiryLabel}</strong>
                            </p>
                        </motion.div>

                        {/* Feature list */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="mt-6 grid grid-cols-2 gap-2 text-left"
                        >
                            {PRO_FEATURES.map((f, i) => (
                                <motion.div
                                    key={f.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.07 }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background-subtle)] border border-[var(--border-subtle)]"
                                >
                                    <span className="text-base leading-none">{f.icon}</span>
                                    <span className="text-xs font-medium text-[var(--text-secondary)] leading-tight">{f.label}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.75 }}
                            onClick={onClose}
                            className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[#ec4899] text-white font-semibold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            Start exploring Pro ✨
                        </motion.button>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="mt-3 text-xs text-[var(--text-tertiary)]"
                        >
                            No credit card required &mdash; cancel anytime
                        </motion.p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
