'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTask, deleteTask } from '@/actions/task';
import { TaskPriority, TaskStatus } from '@/models/Task';
import { ArrowPathIcon, TrashIcon, CalendarIcon, Squares2X2Icon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ArchivedTask {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: TaskPriority;
    boardId: string;
    createdAt: string;
    updatedAt: string;
    assignees: {
        id: string;
        name: string;
        email: string;
        image?: string;
    }[];
}

interface ArchiveListProps {
    initialTasks: ArchivedTask[];
    workspaceSlug: string;
}

export function ArchiveList({ initialTasks, workspaceSlug }: ArchiveListProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState<ArchivedTask[]>(initialTasks);
    const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    // Update local state when initialTasks changes (after revalidation)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleRestore = async (task: ArchivedTask) => {
        setActioningIds(prev => new Set(prev).add(task.id));
        setError(null);
        try {
            // Restore to DONE
            await updateTask(task.id, { status: 'DONE' as TaskStatus });
            setTasks(prev => prev.filter(t => t.id !== task.id));
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to restore task');
        } finally {
            setActioningIds(prev => {
                const next = new Set(prev);
                next.delete(task.id);
                return next;
            });
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Are you sure you want to permanently delete this task?')) return;

        setActioningIds(prev => new Set(prev).add(taskId));
        setError(null);
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task');
        } finally {
            setActioningIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-secondary)] bg-[var(--background-subtle)] rounded-xl border-2 border-dashed border-[var(--border-subtle)]">
                <TrashIcon className="w-12 h-12 mb-4 text-[var(--text-tertiary)]" />
                <h3 className="text-lg font-medium text-[var(--foreground)]">No archived tasks</h3>
                <p className="mt-1">Tasks you archive will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
            {error && (
                <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg p-4 m-4 flex items-center gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-[var(--error-primary)] flex-shrink-0" />
                    <p className="text-sm font-medium text-[var(--error-text-strong)]">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-[var(--error-primary)] hover:opacity-80">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="text-xs uppercase bg-[var(--background-subtle)] border-b border-[var(--border-subtle)]">
                        <tr>
                            <th className="px-6 py-3 font-medium">Task</th>
                            <th className="px-6 py-3 font-medium">Archived Date</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {tasks.map((task) => {
                            const isPending = actioningIds.has(task.id);
                            return (
                                <tr key={task.id} className="hover:bg-[var(--background-subtle)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-[var(--foreground)]">{task.title}</div>
                                        {task.description && (
                                            <div className="text-[var(--text-secondary)] text-xs mt-0.5 line-clamp-1">{task.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                                        {new Date(task.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRestore(task)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--info-primary)] bg-[var(--info-bg)] rounded-md hover:opacity-80 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--info-primary)] focus-visible:ring-offset-2"
                                            >
                                                {isPending ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <ArrowPathIcon className="w-3.5 h-3.5" />}
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--error-primary)] bg-[var(--error-bg)] rounded-md hover:opacity-80 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--error-primary)] focus-visible:ring-offset-2"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
