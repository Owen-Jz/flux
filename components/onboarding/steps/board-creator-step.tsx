'use client';

import { useState } from 'react';
import { Squares2X2Icon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { createBoard } from '@/actions/board';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface BoardCreatorStepProps {
    workspaceSlug: string;
    onComplete: () => void;
    onSkip: () => void;
}

const BOARD_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#22c55e', // Green
    '#14b8a6', // Teal
];

export function BoardCreatorStep({ workspaceSlug, onComplete, onSkip }: BoardCreatorStepProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(BOARD_COLORS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const result = await createBoard(workspaceSlug, {
                name,
                description: '',
                color,
            });

            // Track onboarding progress
            await updateOnboardingProgress('createdFirstBoard');

            // Dispatch event for optimistic UI update
            window.dispatchEvent(new CustomEvent('board-created', { detail: result }));

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: color }}
                >
                    <Squares2X2Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Create Your First Board</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Boards organize your tasks into workflow stages like &quot;To Do&quot;, &quot;In Progress&quot;, and &quot;Done&quot;.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Board Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Marketing, Development, Design"
                        className="w-full px-3 py-2.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)] text-sm"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {BOARD_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-lg transition-all ${
                                    color === c
                                        ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--foreground)] scale-110'
                                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

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
                        type="submit"
                        disabled={isLoading || !name.trim()}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                        {isLoading ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Create Board
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}