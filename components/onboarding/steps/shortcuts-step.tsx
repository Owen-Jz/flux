'use client';

import React, { useState } from 'react';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface ShortcutsStepProps {
    onComplete: () => void;
    onSkip: () => void;
}

const SHORTCUTS = [
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['C'], description: 'Create new task' },
    { keys: ['/'], description: 'Search tasks' },
    { keys: ['↑', '↓'], description: 'Navigate tasks' },
    { keys: ['Enter'], description: 'Open selected task' },
    { keys: ['E'], description: 'Edit selected task' },
    { keys: ['Del'], description: 'Delete selected task' },
    { keys: ['Esc'], description: 'Close modal/dialog' },
];

function ShortcutKey({ keys }: { keys: string[] }) {
    return (
        <div className="flex items-center gap-1">
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    <kbd className="px-2 py-1 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded text-xs font-mono font-semibold text-[var(--text-primary)] shadow-sm">
                        {key}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-[var(--text-secondary)]">/</span>}
                </React.Fragment>
            ))}
        </div>
    );
}

export function ShortcutsStep({ onComplete, onSkip }: ShortcutsStepProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingProgress('completedTutorial');
            onComplete();
        } catch (error) {
            console.error('Failed to update onboarding progress:', error);
            onComplete();
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[var(--flux-warning-bg)]">
                    <AcademicCapIcon className="w-7 h-7 text-[var(--flux-warning-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Keyboard Shortcuts</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Speed up your workflow with these handy keyboard shortcuts.
                </p>
            </div>

            {/* Shortcuts Grid */}
            <div className="bg-[var(--background-subtle)]/50 rounded-lg p-4 space-y-2">
                {SHORTCUTS.map((shortcut, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--background-subtle)] transition-colors"
                    >
                        <span className="text-sm text-[var(--text-secondary)]">{shortcut.description}</span>
                        <ShortcutKey keys={shortcut.keys} />
                    </div>
                ))}
            </div>

            <p className="text-xs text-center text-[var(--text-tertiary)]">
                Press <kbd className="px-1.5 py-0.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded text-xs font-mono">?</kbd> anywhere to see all shortcuts
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onSkip}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--background-subtle)]"
                >
                    Skip
                </button>
                <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                    {isLoading ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Got It!
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}