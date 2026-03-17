'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    Squares2X2Icon,
    UsersIcon,
    CheckCircleIcon,
    Bars3BottomLeftIcon,
    AcademicCapIcon,
    ChevronUpIcon,
    SparklesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { getOnboardingProgress, updateOnboardingProgress, dismissOnboarding, isEligibleForOnboarding } from '@/actions/onboarding';

interface OnboardingChecklistProps {
    workspaceSlug?: string;
}

interface Progress {
    createdFirstBoard: boolean;
    addedFirstTeamMember: boolean;
    createdFirstTask: boolean;
    completedFirstDragDrop: boolean;
    completedTutorial: boolean;
    dismissedAt: Date | string | null;
}

const checklistItems = [
    {
        id: 'createdFirstBoard',
        label: 'Create your first board',
        description: 'Organize your tasks into boards',
        icon: Squares2X2Icon,
        href: null, // Will navigate to workspace root
    },
    {
        id: 'addedFirstTeamMember',
        label: 'Add team members',
        description: 'Collaborate with your team',
        icon: UsersIcon,
        href: 'team',
    },
    {
        id: 'createdFirstTask',
        label: 'Create your first task',
        description: 'Add a task to get started',
        icon: CheckCircleIcon,
        href: null, // Will navigate to first board
    },
    {
        id: 'completedFirstDragDrop',
        label: 'Try drag-and-drop',
        description: 'Move tasks between columns',
        icon: Bars3BottomLeftIcon,
        href: null, // Will navigate to first board
    },
    {
        id: 'completedTutorial',
        label: 'Complete the tutorial',
        description: 'Learn all the features',
        icon: AcademicCapIcon,
        href: null, // Will trigger tutorial
    },
];

export function OnboardingChecklist({ workspaceSlug }: OnboardingChecklistProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [justCompleted, setJustCompleted] = useState(false);

    useEffect(() => {
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        try {
            const eligible = await isEligibleForOnboarding();
            if (eligible) {
                loadProgress();
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to check eligibility:', error);
            setIsLoading(false);
        }
    };

    const loadProgress = async () => {
        try {
            const data = await getOnboardingProgress();
            setProgress(data);
        } catch (error) {
            console.error('Failed to load onboarding progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completedCount = progress
        ? Object.values(progress).filter(
              (v, i) => typeof v === 'boolean' && v && i < 5
          ).length
        : 0;
    const totalCount = 5;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isComplete = completedCount === totalCount;

    // Trigger celebration when completed
    useEffect(() => {
        if (isComplete && justCompleted) {
            triggerCelebration();
        }
    }, [isComplete, justCompleted]);

    const triggerCelebration = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'],
        });
    };

    const handleItemClick = async (item: (typeof checklistItems)[0]) => {
        if (!progress) return;

        // Mark as complete if not already
        if (!progress[item.id as keyof Progress]) {
            await updateOnboardingProgress(item.id as any);
            const newProgress = { ...progress, [item.id]: true };
            setProgress(newProgress);

            // Check if this completes the checklist
            const newCompletedCount = Object.values(newProgress).filter(
                (v, i) => typeof v === 'boolean' && v && i < 5
            ).length;
            if (newCompletedCount === totalCount) {
                setJustCompleted(true);
            }
        }

        // Navigate to the appropriate page
        if (workspaceSlug) {
            if (item.id === 'completedTutorial') {
                // Trigger tutorial - just close the panel
                setIsOpen(false);
            } else if (item.href) {
                router.push(`/${workspaceSlug}/${item.href}`);
            } else {
                router.push(`/${workspaceSlug}`);
            }
        }
    };

    const handleDismiss = async () => {
        await dismissOnboarding();
        setIsOpen(false);
    };

    if (isLoading || !progress) {
        return null;
    }

    // Don't show if dismissed
    if (progress.dismissedAt && isComplete) {
        return null;
    }

    // If complete and not just completed, show minimal "complete" badge
    if (isComplete && !justCompleted) {
        return (
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[var(--flux-success-bg)] to-[var(--flux-info-bg)] border border-[var(--flux-success-border)] hover:opacity-90 transition-opacity"
                >
                    <SparklesIcon className="w-5 h-5 text-[var(--flux-success-primary)]" />
                    <span className="text-sm font-medium text-[var(--flux-success-text-strong)]">
                        Onboarding Complete!
                    </span>
                    <ChevronUpIcon className="w-4 h-4 ml-auto text-[var(--flux-success-primary)]" />
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-[var(--border-subtle)]">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="open"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    Getting Started
                                </span>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--background-subtle)] transition-colors"
                                title="Dismiss"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {completedCount} of {totalCount} completed
                                </span>
                                <span className="text-xs font-semibold text-[var(--brand-primary)]">
                                    {percentage}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-[var(--background-subtle)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-1">
                            {checklistItems.map((item, index) => {
                                const isCompleted = progress[item.id as keyof Progress] as boolean;
                                const Icon = item.icon;

                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleItemClick(item)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                                            isCompleted
                                                ? 'bg-[var(--flux-success-bg)]/50 text-[var(--text-secondary)]'
                                                : 'hover:bg-[var(--background-subtle)] text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isCompleted
                                                    ? 'bg-[var(--flux-success-primary)] text-white'
                                                    : 'bg-[var(--background-subtle)] text-[var(--text-tertiary)]'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                            ) : (
                                                <Icon className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-[var(--text-tertiary)] truncate">
                                                {item.description}
                                            </p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--background-subtle)] hover:bg-[var(--border-subtle)] transition-colors"
                    >
                        <SparklesIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            Getting Started
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="h-1.5 w-8 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--brand-primary)] rounded-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                                {completedCount}/{totalCount}
                            </span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
