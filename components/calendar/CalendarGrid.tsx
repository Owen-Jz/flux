'use client';

import type { CalendarTask } from '@/actions/task';
import { CalendarTaskChip } from './CalendarTaskChip';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS_PER_DAY = 3;

function getDaysInMonth(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Pad start with nulls represented as negative days — easier: build full 6-week grid
    const startPad = firstDay.getDay(); // 0=Sun
    for (let i = startPad - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    // Pad end to at least 35 cells (5 rows), completing the last row
    const minCells = days.length <= 35 ? 35 : 42;
    const remaining = minCells - days.length;
    for (let d = 1; d <= remaining; d++) {
        days.push(new Date(year, month + 1, d));
    }
    return days;
}

function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface CalendarGridProps {
    year: number;
    month: number; // 0-indexed
    tasks: CalendarTask[];
    onDragStart: (taskId: string) => void;
    onDrop: (date: Date) => void;
    onDayClick: (date: Date) => void;
    onTaskClick: (task: CalendarTask) => void;
    isReadOnly: boolean;
}

export function CalendarGrid({ year, month, tasks, onDragStart, onDrop, onDayClick, onTaskClick, isReadOnly }: CalendarGridProps) {
    const days = getDaysInMonth(year, month);
    const today = toDateKey(new Date());

    // Group tasks by date key
    const tasksByDay = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
        const [yy, mm, dd] = task.dueDate.substring(0, 10).split('-').map(Number);
        const key = toDateKey(new Date(yy, mm - 1, dd));
        if (!tasksByDay.has(key)) tasksByDay.set(key, []);
        tasksByDay.get(key)!.push(task);
    }

    return (
        <div className="flex-1 overflow-auto">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-[var(--text-secondary)] py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                {days.map((date) => {
                    const key = toDateKey(date);
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = key === today;
                    const dayTasks = tasksByDay.get(key) ?? [];
                    const overflow = dayTasks.length - MAX_CHIPS_PER_DAY;

                    return (
                        <div
                            key={key}
                            className={`bg-[var(--background)] min-h-[100px] p-1.5 flex flex-col gap-1 transition-colors ${
                                isCurrentMonth ? '' : 'opacity-40'
                            } ${!isReadOnly ? 'cursor-pointer hover:bg-[var(--surface)]' : ''}`}
                            onDragOver={isReadOnly ? undefined : (e) => e.preventDefault()}
                            onDrop={isReadOnly ? undefined : (e) => {
                                e.preventDefault();
                                onDrop(date);
                            }}
                            onClick={isReadOnly ? undefined : () => onDayClick(date)}
                        >
                            <span
                                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                                    isToday
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'text-[var(--text-secondary)]'
                                }`}
                            >
                                {date.getDate()}
                            </span>

                            {dayTasks.slice(0, MAX_CHIPS_PER_DAY).map((task) => (
                                <div key={task.id} onClick={(e) => e.stopPropagation()}>
                                    <CalendarTaskChip
                                        task={task}
                                        onDragStart={onDragStart}
                                        onClick={onTaskClick}
                                        isReadOnly={isReadOnly}
                                    />
                                </div>
                            ))}

                            {overflow > 0 && (
                                <span className="text-xs text-[var(--text-secondary)] pl-1">
                                    +{overflow} more
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
