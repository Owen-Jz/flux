'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    XMarkIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    Square2StackIcon,
    TableCellsIcon,
    ArrowUturnLeftIcon,
    CalendarIcon,
    LinkIcon,
} from '@heroicons/react/24/outline';
import { createFromAIPlan } from '@/actions/ai-plan';
import type {
    AIPlanRequest,
    AIPlan,
    UIAIPlan,
    UITaskPlanItem,
} from '@/types/ai-plan';

type PlanStep = 'scope' | 'input' | 'planning' | 'review' | 'creating' | 'done';

interface PlanWithAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardSlug: string;
    boardName: string;
    workspaceSlug: string;
}

function toUIPlan(plan: AIPlan): UIAIPlan {
    return {
        type: plan.type,
        title: plan.title,
        summary: plan.summary,
        tasks: plan.tasks?.map(t => ({ ...t, selected: true })),
        boards: plan.boards?.map(b => ({
            ...b,
            selected: true,
            expanded: true,
            tasks: b.tasks.map(t => ({ ...t, selected: true })),
        })),
    };
}

const PRIORITY_STYLES: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

export function PlanWithAIModal({
    isOpen,
    onClose,
    boardId,
    boardSlug,
    boardName,
    workspaceSlug,
}: PlanWithAIModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<PlanStep>('scope');
    const [scale, setScale] = useState<'board' | 'project'>('board');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [contextLinks, setContextLinks] = useState('');
    const [maxTasksPerBoard, setMaxTasksPerBoard] = useState('');
    const [uiPlan, setUiPlan] = useState<UIAIPlan | null>(null);
    const [cyclingIndex, setCyclingIndex] = useState(0);
    const [error, setError] = useState('');
    const [creationResult, setCreationResult] = useState<{ boardsCreated: number; tasksCreated: number } | null>(null);

    const cyclingMessages = [
        'Analysing your project...',
        'Identifying workstreams...',
        'Planning tasks...',
        'Estimating effort...',
        'Structuring the plan...',
    ];

    const handleReset = () => {
        setStep('scope');
        setScale('board');
        setDescription('');
        setDeadline('');
        setContextLinks('');
        setMaxTasksPerBoard('');
        setUiPlan(null);
        setError('');
        setCreationResult(null);
        setCyclingIndex(0);
    };

    const handleClose = () => { handleReset(); onClose(); };

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setStep('planning');
        setError('');
        const interval = setInterval(() => setCyclingIndex(i => (i + 1) % cyclingMessages.length), 1500);
        try {
            const links = contextLinks.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 5);
            const body: AIPlanRequest = {
                description: description.trim(),
                scale,
                boardId: scale === 'board' ? boardId : undefined,
                workspaceSlug,
                deadline: deadline || undefined,
                contextLinks: links.length > 0 ? links : undefined,
                maxTasksPerBoard: maxTasksPerBoard ? parseInt(maxTasksPerBoard, 10) : 10,
            };
            const res = await fetch('/api/ai/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Planning failed'); }
            const plan = await res.json() as AIPlan;
            setUiPlan(toUIPlan(plan));
            setStep('review');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setStep('input');
        } finally {
            clearInterval(interval);
        }
    };

    const toggleTask = (taskIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.tasks) return prev;
            return { ...prev, tasks: prev.tasks.map((t, i) => i === taskIndex ? { ...t, selected: !t.selected } : t) };
        });
    };

    const toggleBoard = (boardIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            return { ...prev, boards: prev.boards.map((b, i) => { if (i !== boardIndex) return b; const selected = !b.selected; return { ...b, selected, tasks: b.tasks.map(t => ({ ...t, selected })) }; }) };
        });
    };

    const toggleBoardTask = (boardIndex: number, taskIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            return { ...prev, boards: prev.boards.map((b, bi) => { if (bi !== boardIndex) return b; const tasks = b.tasks.map((t, ti) => ti === taskIndex ? { ...t, selected: !t.selected } : t); return { ...b, tasks, selected: tasks.some(t => t.selected) }; }) };
        });
    };

    const toggleBoardExpanded = (boardIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            return { ...prev, boards: prev.boards.map((b, i) => i === boardIndex ? { ...b, expanded: !b.expanded } : b) };
        });
    };

    const handleConfirm = async () => {
        if (!uiPlan) return;
        setStep('creating');
        try {
            let result;
            if (uiPlan.type === 'board') {
                const confirmedTasks = (uiPlan.tasks ?? []).filter(t => t.selected).map(({ selected: _s, ...rest }: UITaskPlanItem) => rest);
                result = await createFromAIPlan(workspaceSlug, boardSlug, boardId, { type: 'board', tasks: confirmedTasks });
            } else {
                const confirmedBoards = (uiPlan.boards ?? []).filter(b => b.selected).map(b => ({ name: b.name, description: b.description, tasks: b.tasks.filter(t => t.selected).map(({ selected: _s, ...rest }: UITaskPlanItem) => rest) }));
                result = await createFromAIPlan(workspaceSlug, boardSlug, boardId, { type: 'project', boards: confirmedBoards });
            }
            if (!result.success) { setError(result.error ?? 'Creation failed'); setStep('review'); return; }
            setCreationResult({ boardsCreated: result.boardsCreated, tasksCreated: result.tasksCreated });
            setStep('done');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Creation failed');
            setStep('review');
        }
    };

    const selectedCount = uiPlan?.type === 'board'
        ? (uiPlan.tasks ?? []).filter(t => t.selected).length
        : (uiPlan?.boards ?? []).reduce((acc, b) => acc + b.tasks.filter(t => t.selected).length, 0);
    const selectedBoardCount = (uiPlan?.boards ?? []).filter(b => b.selected).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={step === 'planning' || step === 'creating' ? undefined : handleClose} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="fixed inset-4 sm:inset-0 sm:m-auto w-auto sm:max-w-2xl h-fit max-h-[90vh] overflow-hidden bg-[var(--surface)] rounded-2xl shadow-2xl z-50 border border-[var(--border-subtle)]">
                        {/* Header */}
                        <div className="relative px-4 md:px-6 py-4 md:py-5 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/5 to-purple-500/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--foreground)]">Plan with AI</h2>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {step === 'scope' && 'Choose the scale of your plan'}
                                            {step === 'input' && 'Describe what you want to build'}
                                            {step === 'planning' && 'Generating your plan...'}
                                            {step === 'review' && 'Review and edit your plan'}
                                            {step === 'creating' && 'Creating your project...'}
                                            {step === 'done' && 'Your plan is ready'}
                                        </p>
                                    </div>
                                </div>
                                {step !== 'planning' && step !== 'creating' && (
                                    <button onClick={handleClose} aria-label="Close" className="p-2.5 rounded-xl hover:bg-[var(--background-subtle)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 md:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

                            {/* Scope step */}
                            {step === 'scope' && (
                                <div className="space-y-5">
                                    <p className="text-sm text-[var(--text-secondary)]">What are you planning?</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button onClick={() => setScale('board')} className={`p-5 rounded-xl border-2 text-left transition-all ${scale === 'board' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'}`}>
                                            <TableCellsIcon className="w-8 h-8 text-[var(--brand-primary)] mb-3" />
                                            <h3 className="font-bold text-[var(--foreground)] mb-1">This board</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">Generate tasks for <span className="font-medium">{boardName}</span></p>
                                        </button>
                                        <button onClick={() => setScale('project')} className={`p-5 rounded-xl border-2 text-left transition-all ${scale === 'project' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'}`}>
                                            <Square2StackIcon className="w-8 h-8 text-purple-500 mb-3" />
                                            <h3 className="font-bold text-[var(--foreground)] mb-1">Full project</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">Generate multiple boards with tasks — for bigger plans</p>
                                        </button>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setStep('input')} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 transition-all">
                                        <SparklesIcon className="w-5 h-5" />
                                        Continue
                                    </motion.button>
                                </div>
                            )}

                            {/* Input step */}
                            {step === 'input' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            What are you building? <span className="text-red-500">*</span>
                                        </label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={scale === 'board' ? 'e.g., Build a restaurant website for a client in Lagos — homepage, menu, booking form, contact page' : 'e.g., Launch a SaaS task management product — design, frontend, backend, marketing, and launch'} className="input text-base md:text-sm min-h-[100px] resize-none" maxLength={1000} autoFocus />
                                        <p className="text-xs text-[var(--text-tertiary)]">The more specific you are, the better the plan.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <CalendarIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Deadline <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input text-base md:text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <LinkIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Context links <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <textarea value={contextLinks} onChange={e => setContextLinks(e.target.value)} placeholder={'https://docs.example.com\nhttps://github.com/...'} className="input text-base md:text-sm min-h-[60px] resize-none" />
                                        <p className="text-xs text-[var(--text-tertiary)]">One URL per line, max 5.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Max tasks {scale === 'project' ? 'per board ' : ''}<span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <input type="number" value={maxTasksPerBoard} onChange={e => setMaxTasksPerBoard(e.target.value)} placeholder="Leave empty for default (10)" className="input text-base md:text-sm" min={1} max={20} />
                                    </div>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                                        </motion.div>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => setStep('scope')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--background-subtle)] transition-colors">
                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                            Back
                                        </button>
                                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleGenerate} disabled={!description.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                            <SparklesIcon className="w-5 h-5" />
                                            Generate plan
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Planning step */}
                            {step === 'planning' && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <p className="text-base font-semibold text-[var(--foreground)]">{cyclingMessages[cyclingIndex]}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">This usually takes 5-15 seconds.</p>
                                </div>
                            )}

                            {/* Review step */}
                            {step === 'review' && uiPlan && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                                        <p className="font-semibold text-[var(--foreground)]">{uiPlan.title}</p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">{uiPlan.summary}</p>
                                    </div>
                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                                        </div>
                                    )}
                                    {uiPlan.type === 'board' && uiPlan.tasks && (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {uiPlan.tasks.map((task, i) => (
                                                <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 cursor-pointer transition-colors">
                                                    <input type="checkbox" checked={task.selected} onChange={() => toggleTask(i)} className="mt-0.5 accent-[var(--brand-primary)]" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-sm font-medium ${task.selected ? 'text-[var(--foreground)]' : 'text-[var(--text-tertiary)] line-through'}`}>{task.title}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                                                            <span className="text-xs text-[var(--text-tertiary)]">~{task.estimatedHours}h</span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{task.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {uiPlan.type === 'project' && uiPlan.boards && (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {uiPlan.boards.map((board, bi) => (
                                                <div key={bi} className={`rounded-xl border-2 transition-all ${board.selected ? 'border-[var(--brand-primary)]/30' : 'border-[var(--border-subtle)] opacity-60'}`}>
                                                    <div className="flex items-center gap-3 p-3">
                                                        <input type="checkbox" checked={board.selected} onChange={() => toggleBoard(bi)} className="accent-[var(--brand-primary)]" />
                                                        <button onClick={() => toggleBoardExpanded(bi)} className="flex items-center gap-2 flex-1 text-left">
                                                            {board.expanded ? <ChevronDownIcon className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)]" />}
                                                            <span className="font-semibold text-sm text-[var(--foreground)]">{board.name}</span>
                                                            <span className="text-xs text-[var(--text-tertiary)]">{board.tasks.filter(t => t.selected).length}/{board.tasks.length} tasks</span>
                                                        </button>
                                                    </div>
                                                    {board.expanded && (
                                                        <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-subtle)] pt-2">
                                                            {board.tasks.map((task, ti) => (
                                                                <label key={ti} className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--background)] cursor-pointer">
                                                                    <input type="checkbox" checked={task.selected} onChange={() => toggleBoardTask(bi, ti)} className="mt-0.5 accent-[var(--brand-primary)]" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className={`text-sm ${task.selected ? 'text-[var(--foreground)]' : 'text-[var(--text-tertiary)] line-through'}`}>{task.title}</span>
                                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                                                                            <span className="text-xs text-[var(--text-tertiary)]">~{task.estimatedHours}h</span>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {uiPlan.type === 'board' ? `${selectedCount} task${selectedCount !== 1 ? 's' : ''} selected` : `${selectedBoardCount} board${selectedBoardCount !== 1 ? 's' : ''}, ${selectedCount} task${selectedCount !== 1 ? 's' : ''} selected`}
                                    </p>
                                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                                        <button onClick={() => setStep('input')} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--background-subtle)] transition-colors">
                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                            Start over
                                        </button>
                                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleConfirm} disabled={selectedCount === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {uiPlan.type === 'board' ? `Create ${selectedCount} task${selectedCount !== 1 ? 's' : ''}` : `Create ${selectedBoardCount} board${selectedBoardCount !== 1 ? 's' : ''} + ${selectedCount} tasks`}
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Creating step */}
                            {step === 'creating' && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <p className="text-base font-semibold text-[var(--foreground)]">Creating your project...</p>
                                </div>
                            )}

                            {/* Done step */}
                            {step === 'done' && creationResult && (
                                <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircleIcon className="w-9 h-9 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-[var(--foreground)]">Done!</p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {creationResult.boardsCreated > 0 && <>{creationResult.boardsCreated} board{creationResult.boardsCreated !== 1 ? 's' : ''} and </>}
                                            {creationResult.tasksCreated} task{creationResult.tasksCreated !== 1 ? 's' : ''} created.
                                        </p>
                                    </div>
                                    <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors">
                                        View board
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
