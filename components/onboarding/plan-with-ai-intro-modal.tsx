'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PlanWithAIIntroModalProps {
    isOpen: boolean;
    /** Fired when the user submits a description via "Plan it with AI". */
    onSubmit: (description: string) => void;
    /** Fired when the user skips (button or backdrop). */
    onSkip: () => void;
}

export function PlanWithAIIntroModal({ isOpen, onSubmit, onSkip }: PlanWithAIIntroModalProps) {
    const [description, setDescription] = useState('');

    const trimmed = description.trim();

    const handleSubmit = () => {
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onSkip}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-2xl"
                    >
                        <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[#ec4899]" />

                        <div className="p-4 md:p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ec4899] shadow-lg shadow-[var(--brand-primary)]/30">
                                        <SparklesIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--foreground)]">
                                            What are you working on today?
                                        </h2>
                                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                            We&apos;ll map out the boards and tasks for you with AI.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onSkip}
                                    className="p-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                                    aria-label="Skip"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Launch a SaaS task management product — design, frontend, backend, marketing, and launch"
                                className="input text-base md:text-sm min-h-[110px] resize-none w-full"
                                maxLength={1000}
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                                The more specific you are, the better the plan.
                            </p>

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleSubmit}
                                    disabled={!trimmed}
                                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[#ec4899] text-white text-base md:text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    Plan it with AI
                                </motion.button>
                                <button
                                    onClick={onSkip}
                                    className="w-full sm:w-auto px-4 py-3 bg-[var(--background-subtle)] text-[var(--text-secondary)] text-base md:text-sm font-medium rounded-xl hover:bg-[var(--background-subtle)]/80 transition-colors border border-[var(--border-subtle)]"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
