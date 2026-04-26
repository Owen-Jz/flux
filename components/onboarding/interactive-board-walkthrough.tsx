'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    SparklesIcon,
    CheckCircleIcon,
    Bars4Icon,
    UserPlusIcon,
    ChatBubbleLeftIcon,
    XMarkIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';

interface InteractiveBoardWalkthroughProps {
    workspaceSlug: string;
    onComplete: () => void;
    onSkip: () => void;
}

type WalkthroughStep = 'drag_task' | 'assign_self' | 'add_content' | 'complete';

interface StepConfig {
    id: WalkthroughStep;
    title: string;
    description: string;
    instruction: string;
    icon: React.ElementType;
    targetHint: string;
    completed: boolean;
}

export function InteractiveBoardWalkthrough({
    workspaceSlug,
    onComplete,
    onSkip,
}: InteractiveBoardWalkthroughProps) {
    const [currentStep, setCurrentStep] = useState<WalkthroughStep>('drag_task');
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState('');
    const [completedSteps, setCompletedSteps] = useState<Set<WalkthroughStep>>(new Set());
    const [isDismissed, setIsDismissed] = useState(false);

    const steps: StepConfig[] = [
        {
            id: 'drag_task',
            title: 'Move a task',
            description: 'Drag any task card to a different column to see how easy it is to update progress.',
            instruction: 'Drag a task to another column',
            icon: Bars4Icon,
            targetHint: 'task-card',
            completed: completedSteps.has('drag_task'),
        },
        {
            id: 'assign_self',
            title: 'Assign yourself',
            description: 'Click on a task and assign it to yourself. This helps keep track of who\'s working on what.',
            instruction: 'Click a task, then assign yourself',
            icon: UserPlusIcon,
            targetHint: 'task-card',
            completed: completedSteps.has('assign_self'),
        },
        {
            id: 'add_content',
            title: 'Add a comment',
            description: 'Tasks come alive with context. Add a comment or description to provide more details.',
            instruction: 'Add a comment or update the description',
            icon: ChatBubbleLeftIcon,
            targetHint: 'task-card',
            completed: completedSteps.has('add_content'),
        },
    ];

    // Listen for task interactions to detect walkthrough actions
    useEffect(() => {
        if (isDismissed) return;

        const handleInteraction = (event: CustomEvent) => {
            const { type, taskId } = event.detail || {};

            if (type === 'task_moved' && currentStep === 'drag_task') {
                celebrateStep('drag_task', 'Great job! You moved a task!');
            } else if (type === 'self_assigned' && currentStep === 'assign_self') {
                celebrateStep('assign_self', 'Nice! You assigned yourself to a task.');
            } else if (type === 'comment_added' && currentStep === 'add_content') {
                celebrateStep('add_content', 'Awesome! You added a comment.');
            } else if (type === 'description_updated' && currentStep === 'add_content') {
                celebrateStep('add_content', 'Perfect! You updated the description.');
            }
        };

        window.addEventListener('walkthrough:interaction' as any, handleInteraction);
        return () => window.removeEventListener('walkthrough:interaction' as any, handleInteraction);
    }, [currentStep, completedSteps, isDismissed]);

    const celebrateStep = async (step: WalkthroughStep, message: string) => {
        if (completedSteps.has(step)) return;

        // Trigger confetti
        confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e'],
        });

        setCelebrationMessage(message);
        setShowCelebration(true);

        const newCompleted = new Set(completedSteps);
        newCompleted.add(step);
        setCompletedSteps(newCompleted);

        // Hide celebration after 2 seconds
        setTimeout(() => {
            setShowCelebration(false);

            // Move to next step
            if (step === 'drag_task') {
                setCurrentStep('assign_self');
            } else if (step === 'assign_self') {
                setCurrentStep('add_content');
            } else if (step === 'add_content') {
                // All done!
                setCurrentStep('complete');
                setTimeout(onComplete, 500);
            }
        }, 2000);
    };

    const handleSkip = () => {
        setIsDismissed(true);
        onSkip();
    };

    const currentStepConfig = steps.find((s) => s.id === currentStep);

    if (isDismissed || currentStep === 'complete') {
        return null;
    }

    return (
        <AnimatePresence>
            {/* Step indicator overlay at top */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-0 left-0 right-0 z-[200] pointer-events-none"
            >
                <div className="bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white py-2 px-4 shadow-lg">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                            <span className="font-semibold text-sm">Interactive Walkthrough</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        step.completed
                                            ? 'bg-green-400'
                                            : step.id === currentStep
                                            ? 'bg-white animate-pulse'
                                            : 'bg-white/40'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleSkip}
                            className="pointer-events-auto p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Current step instruction card */}
                {currentStepConfig && (
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2"
                    >
                        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] p-5 max-w-md mx-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <currentStepConfig.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[var(--foreground)] text-lg">
                                        Step {steps.findIndex((s) => s.id === currentStep) + 1}: {currentStepConfig.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        {currentStepConfig.description}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-3 py-1.5 rounded-lg">
                                        <LightBulbIcon className="w-3.5 h-3.5" />
                                        {currentStepConfig.instruction}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Celebration overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-10 h-10" />
                                <div>
                                    <p className="font-bold text-xl">Great job!</p>
                                    <p className="text-white/90 text-sm mt-1">{celebrationMessage}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}

// Helper function to dispatch walkthrough events from board components
export function dispatchWalkthroughEvent(type: string, data?: Record<string, unknown>) {
    window.dispatchEvent(
        new CustomEvent('walkthrough:interaction', {
            detail: { type, ...data },
        })
    );
}