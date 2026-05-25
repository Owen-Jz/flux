'use client';

import { useState } from 'react';
import { CheckCircleIcon, ArrowPathIcon, FlagIcon } from '@heroicons/react/24/outline';
import { createTask } from '@/actions/task';
import { updateOnboardingProgress } from '@/actions/onboarding';
import { toast } from 'sonner';

interface TaskCreatorStepProps {
    workspaceSlug: string;
    boardSlug: string;
    onComplete: () => void;
    onSkip: () => void;
}

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
] as const;

const COLUMN_OPTIONS = [
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'DONE', label: 'Done' },
] as const;

export function TaskCreatorStep({ workspaceSlug, boardSlug, onComplete, onSkip }: TaskCreatorStepProps) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [status, setStatus] = useState<'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('TODO');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            await createTask(workspaceSlug, boardSlug, {
                title: title.trim(),
                priority,
                status,
            });

            // Track onboarding progress
            await updateOnboardingProgress('createdFirstTask');

            toast.success('Task created successfully!');
            onComplete();
        } catch (err: any) {
            const message = err.message || 'Something went wrong';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[var(--flux-info-bg)]">
                    <FlagIcon className="w-7 h-7 text-[var(--flux-info-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Create Your First Task</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Add tasks to your board to track work and collaborate with your team.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Task Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Design new landing page"
                        className="w-full px-3 py-2.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)] text-sm"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Priority
                    </label>
                    <div className="flex gap-2">
                        {PRIORITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPriority(opt.value)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                    priority === opt.value
                                        ? `${opt.color} ring-2 ring-inset ring-black/5 shadow-sm scale-105`
                                        : 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Column
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full px-3 py-2.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)] text-sm"
                    >
                        {COLUMN_OPTIONS.map((col) => (
                            <option key={col.value} value={col.value}>
                                {col.label}
                            </option>
                        ))}
                    </select>
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
                        disabled={isLoading || !title.trim()}
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
                                Create Task
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}