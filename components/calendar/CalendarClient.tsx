'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CalendarTask } from '@/actions/task';
import { updateTaskDueDate, updateTaskScheduledDate, createTask, updateTask } from '@/actions/task';
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
    members?: Member[];
    /** Which date field this calendar reads and writes. `dueDate` (default) is the
     *  workspace calendar; `scheduledDate` is a per-board calendar, isolated from the
     *  workspace view. */
    dateField?: 'dueDate' | 'scheduledDate';
}

export function CalendarClient({ initialTasks, workspaceSlug, userRole, boards, members = [], dateField = 'dueDate' }: CalendarClientProps) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [tasks, setTasks] = useState<CalendarTask[]>(initialTasks);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
    const [createDate, setCreateDate] = useState<Date | null>(null);
    const [selectedBoardSlug, setSelectedBoardSlug] = useState<string>(boards[0]?.slug ?? '');
    // View filter (independent of the create-task board selector above). 'all' shows every board.
    const [viewBoardSlug, setViewBoardSlug] = useState<string>('all');
    const [createError, setCreateError] = useState<string | null>(null);

    const isReadOnly = userRole === 'VIEWER' || userRole === null;

    // Persist a date change to the field this calendar owns. Workspace calendar
    // writes `dueDate`; a per-board calendar writes `scheduledDate`.
    const persistDate = (taskId: string, date: Date) =>
        dateField === 'scheduledDate'
            ? updateTaskScheduledDate(taskId, date)
            : updateTaskDueDate(taskId, date, workspaceSlug);

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

    const goToToday = () => {
        const t = new Date();
        setYear(t.getFullYear());
        setMonth(t.getMonth());
    };

    // Derived view — the React Compiler memoizes this automatically, so no manual useMemo.
    const visibleTasks = viewBoardSlug === 'all'
        ? tasks
        : tasks.filter(t => t.boardSlug === viewBoardSlug);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const handleDrop = async (date: Date) => {
        if (!draggingTaskId) return;
        const taskId = draggingTaskId;
        setDraggingTaskId(null);

        // Capture the original task (guarded so React 18 StrictMode's
        // double-invocation of the updater can't overwrite it with the
        // already-optimistic value). Revert patches only this task on failure,
        // so a concurrent edit to another task isn't clobbered.
        let previousTask: CalendarTask | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            if (!previousTask) previousTask = t;
            const updated: CalendarTask = { ...t };
            updated[dateField] = date.toISOString();
            return updated;
        }));

        try {
            await persistDate(taskId, date);
        } catch {
            const restore = previousTask;
            if (restore) {
                setTasks(prev => prev.map(t => (t.id === taskId ? restore : t)));
            }
        }
    };

    const handleDayClick = (date: Date) => {
        if (isReadOnly || boards.length === 0) return;
        setCreateDate(date);
    };

    const handleCreateSubmit = async (formData: {
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

            // Set the calendar's date field immediately after creation
            await persistDate(result.id, createDate);

            // Add to local state
            const board = boards.find(b => b.slug === selectedBoardSlug);
            const newTask: CalendarTask = {
                id: result.id,
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                boardId: board?.id ?? '',
                boardSlug: selectedBoardSlug,
                createdAt: new Date().toISOString(),
            };
            newTask[dateField] = createDate.toISOString();
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error('Failed to create task', err);
            setCreateError('Failed to create task. Please try again.');
        }
    };

    // Convert CalendarTask to the TaskData shape expected by TaskDetailModal
    const selectedTaskData: TaskData | null = selectedTask
        ? {
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            status: selectedTask.status,
            priority: selectedTask.priority,
            order: 0,
            assignees: [],
            createdAt: selectedTask.createdAt,
        }
        : null;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0 flex-wrap">
                {/* Left cluster: board view filter + (for editors) create-target board selector */}
                <div className="flex items-center gap-2">
                    {boards.length > 1 && (
                        <select
                            value={viewBoardSlug}
                            onChange={e => setViewBoardSlug(e.target.value)}
                            className="text-sm border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                            aria-label="Filter calendar by board"
                        >
                            <option value="all">All boards</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.slug}>{b.name}</option>
                            ))}
                        </select>
                    )}
                    {!isReadOnly && boards.length > 1 && (
                        <select
                            value={selectedBoardSlug}
                            onChange={e => setSelectedBoardSlug(e.target.value)}
                            className="text-sm border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 bg-[var(--surface)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                            aria-label="Select board for new tasks"
                            title="New tasks are created on this board"
                        >
                            {boards.map(b => (
                                <option key={b.id} value={b.slug}>New in: {b.name}</option>
                            ))}
                        </select>
                    )}
                    {boards.length <= 1 && <div />}
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        disabled={isCurrentMonth}
                        aria-label="Jump to current month"
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40 disabled:cursor-default"
                    >
                        Today
                    </button>
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

            {visibleTasks.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {tasks.length === 0
                        ? dateField === 'scheduledDate'
                            ? 'Nothing scheduled yet. Click a day to add a scheduled item to this board.'
                            : 'No scheduled tasks. Set a due date on a task to see it here.'
                        : 'No scheduled tasks on this board.'}
                </p>
            )}

            {createError && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{createError}</span>
                    <button onClick={() => setCreateError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
            )}

            <CalendarGrid
                year={year}
                month={month}
                tasks={visibleTasks}
                onDragStart={setDraggingTaskId}
                onDrop={handleDrop}
                onDayClick={handleDayClick}
                onTaskClick={setSelectedTask}
                isReadOnly={isReadOnly}
                dateField={dateField}
            />

            {/* Task detail modal */}
            {selectedTask && selectedTaskData && (
                <TaskDetailModal
                    task={selectedTaskData}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(taskId: string, data: Partial<TaskData>) => {
                        // Snapshot the task before the optimistic update so we can
                        // revert if the server write fails (otherwise a failed save
                        // silently stays on screen looking persisted — data loss).
                        const previous = tasks.find(t => t.id === taskId);
                        setTasks(prev =>
                            prev.map(t => {
                                if (t.id !== taskId) return t;
                                return {
                                    ...t,
                                    title: (data.title as string | undefined) ?? t.title,
                                    description: data.description !== undefined
                                        ? (data.description as string | undefined) ?? t.description
                                        : t.description,
                                    status: (data.status as CalendarTask['status'] | undefined) ?? t.status,
                                    priority: (data.priority as CalendarTask['priority'] | undefined) ?? t.priority,
                                    dueDate: data.dueDate !== undefined
                                        ? (data.dueDate as string | undefined) ?? t.dueDate
                                        : t.dueDate,
                                };
                            })
                        );
                        updateTask(taskId, {
                            ...(data.title !== undefined && { title: data.title as string }),
                            ...(data.description !== undefined && { description: (data.description as string | undefined) ?? '' }),
                            ...(data.status !== undefined && { status: data.status as CalendarTask['status'] }),
                            ...(data.priority !== undefined && { priority: data.priority as CalendarTask['priority'] }),
                            ...(data.dueDate !== undefined && { dueDate: (data.dueDate as string | undefined) ?? null }),
                        }).catch((err) => {
                            console.error('Failed to update task', err);
                            if (previous) {
                                setTasks(prev => prev.map(t => (t.id === taskId ? previous : t)));
                            }
                        });
                    }}
                    isReadOnly={isReadOnly}
                    members={members}
                />
            )}

            {/* Create task modal */}
            {createDate && (
                <CreateTaskModal
                    isOpen={!!createDate}
                    onClose={() => setCreateDate(null)}
                    onSubmit={handleCreateSubmit}
                    members={members}
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
