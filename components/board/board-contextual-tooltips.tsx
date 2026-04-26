'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipConfig {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

const BOARD_TOOLTIPS: TooltipConfig[] = [
    {
        id: 'drag-tasks',
        targetSelector: '.task-card-drag-handle',
        title: 'Drag to move',
        description: 'Drag tasks between columns to change their status',
        side: 'left',
        delay: 800,
    },
    {
        id: 'click-assign',
        targetSelector: '.task-card-assignees',
        title: 'Assign team members',
        description: 'Click on the assignee area to assign or remove team members from this task',
        side: 'top',
        delay: 1200,
    },
    {
        id: 'click-task',
        targetSelector: '.task-card',
        title: 'Edit task details',
        description: 'Click anywhere on a task to view and edit its details, add comments, and more',
        side: 'right',
        delay: 1600,
    },
    {
        id: 'add-task',
        targetSelector: '.add-task-btn',
        title: 'Add new tasks',
        description: 'Click the + button to quickly add a task to this column',
        side: 'bottom',
        delay: 2000,
    },
];

const STORAGE_KEY = 'flux-board-tooltips-dismissed';

interface TooltipState {
    isVisible: boolean;
    currentIndex: number;
    tooltipPosition: { top: number; left: number } | null;
}

function getTooltipStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function dismissTooltip(id: string) {
    const dismissed = getTooltipStorage();
    if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
}

function hasSeenBoardTooltips(): boolean {
    if (typeof window === 'undefined') return false;
    const dismissed = getTooltipStorage();
    return dismissed.some(d => d.startsWith('board-tooltip-'));
}

export function BoardContextualTooltips() {
    const [state, setState] = useState<TooltipState>({
        isVisible: false,
        currentIndex: 0,
        tooltipPosition: null,
    });
    const [hasVisited, setHasVisited] = useState(false);

    // Check if this is a first board visit on mount
    useEffect(() => {
        setHasVisited(hasSeenBoardTooltips());
    }, []);

    // Show tooltips on first visit after a short delay
    useEffect(() => {
        if (hasVisited) return;

        const timer = setTimeout(() => {
            setState({
                isVisible: true,
                currentIndex: 0,
                tooltipPosition: null,
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [hasVisited]);

    // Calculate position for current tooltip target
    const updateTooltipPosition = useCallback(() => {
        const currentTooltip = BOARD_TOOLTIPS[state.currentIndex];
        if (!currentTooltip) return;

        const element = document.querySelector(currentTooltip.targetSelector);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        let position: { top: number; left: number };

        switch (currentTooltip.side) {
            case 'top':
                position = {
                    top: rect.top + scrollTop - 10,
                    left: rect.left + scrollLeft + rect.width / 2,
                };
                break;
            case 'bottom':
                position = {
                    top: rect.bottom + scrollTop + 10,
                    left: rect.left + scrollLeft + rect.width / 2,
                };
                break;
            case 'left':
                position = {
                    top: rect.top + scrollTop + rect.height / 2,
                    left: rect.left + scrollLeft - 10,
                };
                break;
            case 'right':
            default:
                position = {
                    top: rect.top + scrollTop + rect.height / 2,
                    left: rect.right + scrollLeft + 10,
                };
                break;
        }

        setState(prev => ({ ...prev, tooltipPosition: position }));
    }, [state.currentIndex]);

    // Update position when tooltip becomes visible or index changes
    useEffect(() => {
        if (state.isVisible) {
            const currentTooltip = BOARD_TOOLTIPS[state.currentIndex];
            if (currentTooltip) {
                // Delay to allow DOM to be ready
                const timer = setTimeout(updateTooltipPosition, currentTooltip.delay || 0);
                return () => clearTimeout(timer);
            }
        }
    }, [state.isVisible, state.currentIndex, updateTooltipPosition]);

    // Handle window resize - update position
    useEffect(() => {
        if (state.isVisible) {
            window.addEventListener('scroll', updateTooltipPosition);
            window.addEventListener('resize', updateTooltipPosition);
            return () => {
                window.removeEventListener('scroll', updateTooltipPosition);
                window.removeEventListener('resize', updateTooltipPosition);
            };
        }
    }, [state.isVisible, updateTooltipPosition]);

    const handleNext = () => {
        const currentTooltip = BOARD_TOOLTIPS[state.currentIndex];
        if (currentTooltip) {
            dismissTooltip(`board-tooltip-${currentTooltip.id}`);
        }

        if (state.currentIndex < BOARD_TOOLTIPS.length - 1) {
            setState(prev => ({
                ...prev,
                currentIndex: prev.currentIndex + 1,
                tooltipPosition: null,
            }));
        } else {
            // All tooltips dismissed
            setState(prev => ({ ...prev, isVisible: false }));
            setHasVisited(true);
        }
    };

    const handleDismiss = () => {
        const currentTooltip = BOARD_TOOLTIPS[state.currentIndex];
        if (currentTooltip) {
            dismissTooltip(`board-tooltip-${currentTooltip.id}`);
        }
        setState(prev => ({ ...prev, isVisible: false }));
        setHasVisited(true);
    };

    if (!state.isVisible || state.currentIndex >= BOARD_TOOLTIPS.length) {
        return null;
    }

    const currentTooltip = BOARD_TOOLTIPS[state.currentIndex];
    const progress = `${state.currentIndex + 1} of ${BOARD_TOOLTIPS.length}`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="fixed z-[9999] pointer-events-none"
                style={{
                    top: state.tooltipPosition?.top ?? 0,
                    left: state.tooltipPosition?.left ?? 0,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-xl)] border border-[var(--border-subtle)] p-4 max-w-xs pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                                {currentTooltip.title}
                            </h4>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--background-subtle)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--text-secondary)] mb-3 pl-8">
                        {currentTooltip.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5">
                            {BOARD_TOOLTIPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        index === state.currentIndex
                                            ? 'bg-[var(--brand-primary)]'
                                            : index < state.currentIndex
                                                ? 'bg-[var(--brand-primary)]/40'
                                                : 'bg-[var(--border-subtle)]'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                {progress}
                            </span>
                            {state.currentIndex < BOARD_TOOLTIPS.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleDismiss}
                                    className="text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                                >
                                    Got it
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Highlight indicator pointing to target */}
                    <div
                        className={`absolute w-3 h-3 bg-[var(--surface)] border border-[var(--border-subtle)] rotate-45 ${
                            currentTooltip.side === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2' :
                            currentTooltip.side === 'right' ? '-right-1.5 top-1/2 -translate-y-1/2' :
                            currentTooltip.side === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' :
                            '-bottom-1.5 left-1/2 -translate-x-1/2'
                        }`}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}