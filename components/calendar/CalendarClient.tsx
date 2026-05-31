'use client';

import { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CalendarTask } from '@/actions/task';
import { updateTaskDueDate, createTask } from '@/actions/task';
import { CalendarGrid } from './CalendarGrid';
import { TaskDetailModal } from '@/components/board/task-detail-modal';
import { CreateTaskModal } from '@/components/board/create-task-modal';
import type { TaskData, Member } from '@/components/board/task-card';
import type { TaskPriority, TaskStatus } from '@/models/Task';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
}

interface CalendarClientProps {
    initialTasks: CalendarTask[];
    workspaceSlug: string;
    userRole: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
    boards: Board[];
}

export function CalendarClient({ initialTasks, workspaceSlug, userRole, boards }: CalendarClientProps) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [tasks, setTasks] = useState<CalendarTask[]>(initialTasks);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
    const [createDate, setCreateDate] = useState<Date | null>(null);
    const [selectedBoardSlug, setSelectedBoardSlug] = useState<string>(boards[0]?.slug ?? '');

    const isReadOnly = userRole === 'VIEWER' || userRole === null;

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const handleDrop = useCallback(async (date: Date) => {
        if (!draggingTaskId) return;
        const taskId = draggingTaskId;
        setDraggingTaskId(null);

        // Optimistic update
        setTasks(prev =>
            prev.map(t => t.id === taskId ? { ...t, dueDate: date.toISOString() } : t)
        );

        try {
            await updateTaskDueDate(taskId, date, workspaceSlug);
        } catch {
            // Revert on failure
            setTasks(initialTasks);
        }
    }, [draggingTaskId, workspaceSlug, initialTasks]);

    const handleDayClick = useCallback((date: Date) => {
        if (isReadOnly || boards.length === 0) return;
        setCreateDate(date);
    }, [isReadOnly, boards.length]);

    const handleCreateSubmit = useCallback(async (formData: {
        title: string;
        description?: string;
        priority: TaskPriority;
        status: TaskStatus;
        assignees: Member[];
    }) => {
        if (!createDate || !selectedBoardSlug) return;
        setCreateDate(null);

        try {
            const result = await createTask(workspaceSlug, selectedBoardSlug, {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
            });

            // Set due date immediately after creation
            await updateTaskDueDate(result.id, createDate, workspaceSlug);

            // Add to local state
            const board = boards.find(b => b.slug === selectedBoardSlug);
            setTasks(prev => [...prev, {
                id: result.id,
                title: formData.title,
                dueDate: createDate.toISOString(),
                status: formData.status,
                priority: formData.priority,
                boardId: board?.id ?? '',
                boardSlug: selectedBoardSlug,
            }]);
        } catch (err) {
            console.error('Failed to create task', err);
        }
    }, [createDate, selectedBoardSlug, workspaceSlug, boards]);

    // Convert CalendarTask to the TaskData shape expected by TaskDetailModal
    const selectedTaskData: TaskData | null = selectedTask
        ? {
            id: selectedTask.id,
            title: selectedTask.title,
            status: selectedTask.status,
            priority: selectedTask.priority,
            order: 0,
            assignees: [],
            createdAt: new Date().toISOString(),
        }
        : null;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                {/* Board selector (only when multiple boards and not read-only) */}
                {!isReadOnly && boards.length > 1 && (
                    <select
                        value={selectedBoardSlug}
                        onChange={e => setSelectedBoardSlug(e.target.value)}
                        className="text-sm border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                        aria-label="Select board for new tasks"
                    >
                        {boards.map(b => (
                            <option key={b.id} value={b.slug}>{b.name}</option>
                        ))}
                    </select>
                )}
                {(isReadOnly || boards.length <= 1) && <div />}

                {/* Month navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={prevMonth}
                        aria-label="Previous month"
                        className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold min-w-[130px] text-center">
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        aria-label="Next month"
                        className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {tasks.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    No scheduled tasks. Set a due date on a task to see it here.
                </p>
            )}

            <CalendarGrid
                year={year}
                month={month}
                tasks={tasks}
                onDragStart={setDraggingTaskId}
                onDrop={handleDrop}
                onDayClick={handleDayClick}
                onTaskClick={setSelectedTask}
                isReadOnly={isReadOnly}
            />

            {/* Task detail modal */}
            {selectedTask && selectedTaskData && (
                <TaskDetailModal
                    task={selectedTaskData}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(taskId: string, data: Partial<TaskData>) => {
                        setTasks(prev =>
                            prev.map(t => {
                                if (t.id !== taskId) return t;
                                return {
                                    ...t,
                                    title: (data.title as string | undefined) ?? t.title,
                                    status: (data.status as CalendarTask['status'] | undefined) ?? t.status,
                                    priority: (data.priority as CalendarTask['priority'] | undefined) ?? t.priority,
                                    dueDate: data.dueDate !== undefined
                                        ? (data.dueDate as string | undefined) ?? t.dueDate
                                        : t.dueDate,
                                };
                            })
                        );
                    }}
                    isReadOnly={isReadOnly}
                />
            )}

            {/* Create task modal */}
            {createDate && (
                <CreateTaskModal
                    isOpen={!!createDate}
                    onClose={() => setCreateDate(null)}
                    onSubmit={handleCreateSubmit}
                    members={[]}
                    columns={[
                        { id: 'BACKLOG', title: 'Backlog' },
                        { id: 'TODO', title: 'To Do' },
                        { id: 'IN_PROGRESS', title: 'In Progress' },
                        { id: 'REVIEW', title: 'Review' },
                        { id: 'DONE', title: 'Done' },
                    ]}
                    defaultColumn="TODO"
                />
            )}
        </div>
    );
}
