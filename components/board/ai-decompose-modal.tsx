'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, ArrowPathIcon, CheckCircleIcon, BoltIcon, LinkIcon, DocumentTextIcon, PlusIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface SubTask {
    title: string;
    description: string;
    estimatedHours: number;
    priority: 'Low' | 'Medium' | 'High';
    referenceUrls?: string[];
}

interface DecomposeResponse {
    taskId: string;
    summary: string;
    subtasks: SubTask[];
}

interface AIDecomposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: {
        title: string;
        description: string;
        subtasks: { title: string; completed: boolean }[];
    }) => void;
    boardId: string;
}

export function AIDecomposeModal({
    isOpen,
    onClose,
    onSubmit,
    boardId,
}: AIDecomposeModalProps) {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [contextLinks, setContextLinks] = useState('');
    const [maxSubtasks, setMaxSubtasks] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DecomposeResponse | null>(null);
    const [error, setError] = useState('');
    const [cyclingTextIndex, setCyclingTextIndex] = useState(0);
    const cyclingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const cyclingMessages = [
        'Analyzing task...',
        'Breaking down complexity...',
        'Identifying subtasks...',
        'Generating action items...',
        'Planning execution...',
        'Structuring workflow...',
    ];

    // Cycle through loading messages
    useEffect(() => {
        if (isLoading) {
            setCyclingTextIndex(0);
            cyclingIntervalRef.current = setInterval(() => {
                setCyclingTextIndex((prev) => (prev + 1) % cyclingMessages.length);
            }, 1500);
        } else {
            if (cyclingIntervalRef.current) {
                clearInterval(cyclingIntervalRef.current);
                cyclingIntervalRef.current = null;
            }
        }
        return () => {
            if (cyclingIntervalRef.current) {
                clearInterval(cyclingIntervalRef.current);
            }
        };
    }, [isLoading, cyclingMessages.length]);

    const handleDecompose = async () => {
        if (!taskTitle.trim() || !taskDescription.trim()) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const links = contextLinks
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .slice(0, 5);

            const response = await fetch('/api/v1/tasks/decompose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskTitle: taskTitle.trim(),
                    taskDescription: taskDescription.trim(),
                    contextLinks: links.length > 0 ? links : undefined,
                    maxSubtasks: maxSubtasks ? parseInt(maxSubtasks, 10) : undefined,
                    boardId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to decompose task');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToBoard = () => {
        if (!result) return;

        onSubmit({
            title: taskTitle.trim(),
            description: result.summary,
            subtasks: result.subtasks.map(st => ({
                title: st.title,
                completed: false,
            })),
        });

        // Reset and close
        setTaskTitle('');
        setTaskDescription('');
        setContextLinks('');
        setResult(null);
        onClose();
    };

    const handleClose = () => {
        setTaskTitle('');
        setTaskDescription('');
        setContextLinks('');
        setMaxSubtasks('');
        setResult(null);
        setError('');
        onClose();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'Medium':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            default:
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 m-auto max-w-2xl h-fit max-h-[90vh] overflow-hidden bg-[var(--surface)] rounded-2xl shadow-2xl z-50 border border-[var(--border-subtle)]"
                    >
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/5 to-purple-500/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--foreground)]">
                                            AI Task Decomposition
                                        </h2>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            Break down complex tasks into actionable subtasks
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-xl hover:bg-[var(--background-subtle)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {!result ? (
                                <>
                                    {/* Task Title */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <DocumentTextIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Task Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={taskTitle}
                                            onChange={(e) => setTaskTitle(e.target.value)}
                                            placeholder="e.g., Build user authentication system"
                                            className="input text-sm"
                                            maxLength={120}
                                            autoFocus
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            5-120 characters
                                        </p>
                                    </div>

                                    {/* Task Description */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <BoltIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Task Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={taskDescription}
                                            onChange={(e) => setTaskDescription(e.target.value)}
                                            placeholder="Describe what you want to accomplish. Be specific about requirements, goals, and expected outcomes..."
                                            className="input text-sm min-h-[120px] resize-none"
                                            maxLength={2000}
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            Max 2000 characters
                                        </p>
                                    </div>

                                    {/* Context Links */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <LinkIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Context Links <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            value={contextLinks}
                                            onChange={(e) => setContextLinks(e.target.value)}
                                            placeholder="Paste relevant URLs to give AI context (one per line)&#10;https://docs.example.com&#10;https://github.com/..."
                                            className="input text-sm min-h-[80px] resize-none"
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            Max 5 URLs - provides additional context for better decomposition
                                        </p>
                                    </div>

                                    {/* Max Subtasks */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Max Subtasks <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={maxSubtasks}
                                            onChange={(e) => setMaxSubtasks(e.target.value)}
                                            placeholder="Leave empty for default (3-8)"
                                            className="input text-sm"
                                            min={1}
                                            max={20}
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            Limit the number of subtasks (1-20). AI will generate 3-8 by default.
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                        >
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                                {error}
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Decompose Button */}
                                    <motion.button
                                        onClick={handleDecompose}
                                        disabled={isLoading || !taskTitle.trim() || !taskDescription.trim()}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isLoading ? (
                                            <>
                                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                                <span>{cyclingMessages[cyclingTextIndex]}</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                <span>Decompose with AI</span>
                                            </>
                                        )}
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    {/* Success Header */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800 dark:text-green-300">Task decomposed successfully!</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">{result.subtasks.length} subtasks generated</p>
                                        </div>
                                    </motion.div>

                                    {/* Results */}
                                    <div className="space-y-4">
                                        {/* Summary */}
                                        <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                <DocumentTextIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                                Summary
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {result.summary}
                                            </p>
                                        </div>

                                        {/* Subtasks */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                                <BoltIcon className="w-4 h-4 text-purple-500" />
                                                Generated Subtasks
                                            </h3>
                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                                {result.subtasks.map((subtask, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-md bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold flex items-center justify-center">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="font-medium text-[var(--foreground)]">
                                                                    {subtask.title}
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(subtask.priority)}`}>
                                                                {subtask.priority}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-2 ml-7">
                                                            {subtask.description}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 ml-7">
                                                            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                ~{subtask.estimatedHours}h estimated
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setResult(null)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--foreground)] font-semibold hover:bg-[var(--background-subtle)] transition-colors"
                                            >
                                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                                Try Again
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleAddToBoard}
                                                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 transition-all"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add to Board
                                            </motion.button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
