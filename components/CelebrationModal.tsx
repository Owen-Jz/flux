'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { XMarkIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';
import InviteMemberModal from './InviteMemberModal';

interface CelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceSlug: string;
}

const STORAGE_KEY = 'celebration_modal_dismissed';

export default function CelebrationModal({ isOpen, onClose, workspaceSlug }: CelebrationModalProps) {
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;

            // Fire confetti
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6'];

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors,
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors,
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();

            // Big burst in the center
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.6 },
                colors,
            });
        }
    }, [isOpen]);

    const handleDismiss = () => {
        // Mark as dismissed in localStorage
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            // Ignore storage errors
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={handleDismiss}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
                    className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-8 relative shadow-2xl text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-[var(--background-subtle)]"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                        Congratulations!
                    </h2>

                    {/* Subtext */}
                    <p className="text-[var(--text-secondary)] mb-6">
                        Your first board has been created. Ready to bring your team on board?
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={() => {
                            handleDismiss();
                            // Open invite modal - dispatch custom event
                            window.dispatchEvent(new CustomEvent('open-invite-modal', { detail: { workspaceSlug } }));
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/30"
                    >
                        <UsersIcon className="w-4 h-4" />
                        Share with Team
                    </button>

                    {/* Skip link */}
                    <button
                        onClick={handleDismiss}
                        className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                        Maybe later
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Helper to check if celebration should be shown
export function shouldShowCelebration(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
        return true;
    }
}

// Helper to reset celebration (for testing)
export function resetCelebration(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore
    }
}