'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTask, deleteTask } from '@/actions/task';
import { TaskPriority, TaskStatus } from '@/models/Task';
import { Loader2, RotateCcw, Trash2, Calendar, Layout } from 'lucide-react';

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

    const handleRestore = async (task: ArchivedTask) => {
        setActioningIds(prev => new Set(prev).add(task.id));
        try {
            // Restore to DONE
            await updateTask(task.id, { status: 'DONE' as TaskStatus });
            setTasks(prev => prev.filter(t => t.id !== task.id));
            router.refresh();
        } catch (error) {
            console.error('Failed to restore task:', error);
            alert('Failed to restore task');
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
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Failed to delete task');
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
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Trash2 className="w-12 h-12 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No archived tasks</h3>
                <p className="mt-1">Tasks you archive will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">Task</th>
                            <th className="px-6 py-3 font-medium">Archived Date</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => {
                            const isPending = actioningIds.has(task.id);
                            return (
                                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{task.title}</div>
                                        {task.description && (
                                            <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{task.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(task.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRestore(task)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
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
