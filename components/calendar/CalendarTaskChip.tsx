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
}

export function CalendarTaskChip({ task, onDragStart, onClick, isReadOnly }: CalendarTaskChipProps) {
    return (
        <button
            draggable={!isReadOnly}
            onDragStart={isReadOnly ? undefined : (e) => {
                e.dataTransfer.setData('taskId', task.id);
                onDragStart(task.id);
            }}
            onClick={() => onClick(task)}
            title={`${task.title} — ${STATUS_LABEL[task.status]}`}
            className="w-full text-left flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer group"
        >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            <span className="text-xs text-[var(--foreground)] truncate leading-tight">
                {task.title}
            </span>
        </button>
    );
}
