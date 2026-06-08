'use client';

import type { CalendarTask } from '@/actions/task';

const PRIORITY_DOT: Record<CalendarTask['priority'], string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-blue-400',
};

const STATUS_LABEL: Record<CalendarTask['status'], string> = {
    BACKLOG: 'Backlog',
    TODO: 'Todo',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    DONE: 'Done',
    ARCHIVED: 'Archived',
};

interface CalendarTaskChipProps {
    task: CalendarTask;
    onDragStart: (taskId: string) => void;
    onClick: (task: CalendarTask) => void;
    isReadOnly: boolean;
    /** True when the task is past its due date and not yet completed/archived. */
    isOverdue?: boolean;
}

export function CalendarTaskChip({ task, onDragStart, onClick, isReadOnly, isOverdue = false }: CalendarTaskChipProps) {
    const isDone = task.status === 'DONE' || task.status === 'ARCHIVED';

    const stateClasses = isDone
        ? 'bg-[var(--surface)] border-[var(--border-subtle)] opacity-55 hover:opacity-80'
        : isOverdue
            ? 'bg-red-500/[0.06] border-red-500/40 hover:border-red-500'
            : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)]';

    const titleSuffix = isDone ? '' : isOverdue ? ' · Overdue' : '';

    return (
        <button
            draggable={!isReadOnly}
            onDragStart={isReadOnly ? undefined : (e) => {
                e.dataTransfer.setData('taskId', task.id);
                onDragStart(task.id);
            }}
            onClick={() => onClick(task)}
            title={`${task.title} — ${STATUS_LABEL[task.status]}${titleSuffix}`}
            className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded border transition-colors cursor-pointer group ${stateClasses}`}
        >
            {isDone ? (
                <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="w-2.5 h-2.5 flex-shrink-0 text-[var(--text-secondary)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3.5 8.5l3 3 6-7" />
                </svg>
            ) : (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            )}
            <span
                className={`text-xs truncate leading-tight ${
                    isDone
                        ? 'text-[var(--text-secondary)] line-through'
                        : isOverdue
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-[var(--foreground)]'
                }`}
            >
                {task.title}
            </span>
        </button>
    );
}
