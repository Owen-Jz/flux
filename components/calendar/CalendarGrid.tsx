'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

/** Local midnight today, used to compare due dates without time-of-day noise. */
function startOfToday(): number {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
}

/** A task is overdue if its day is before today and it isn't done/archived. */
function isTaskOverdue(task: CalendarTask, dayKey: string, todayKey: string, todayMs: number): boolean {
    if (task.status === 'DONE' || task.status === 'ARCHIVED') return false;
    if (dayKey === todayKey) return false;
    const [yy, mm, dd] = dayKey.split('-').map(Number);
    return new Date(yy, mm - 1, dd).getTime() < todayMs;
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
    const todayMs = startOfToday();
    // The expanded popover is keyed by both the day and the month it was opened in,
    // so navigating to another month implicitly collapses any open popover during
    // render (no effect, no ref-in-render) — a stale month's key can never match.
    const monthKey = `${year}-${month}`;
    const [expanded, setExpanded] = useState<{ day: string; month: string } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const closePopover = () => setExpanded(null);

    // Close the day popover on outside click or Escape so it never traps focus.
    useEffect(() => {
        if (!expanded) return;
        const onPointer = (e: MouseEvent) => {
            if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
                setExpanded(null);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExpanded(null);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [expanded]);

    // Group tasks by date key
    const tasksByDay = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
        const [yy, mm, dd] = task.dueDate.substring(0, 10).split('-').map(Number);
        const key = toDateKey(new Date(yy, mm - 1, dd));
        if (!tasksByDay.has(key)) tasksByDay.set(key, []);
        tasksByDay.get(key)!.push(task);
    }

    return (
        <div className="flex-1 overflow-auto" ref={gridRef}>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d, i) => (
                    <div
                        key={d}
                        className={`text-center text-xs font-medium py-2 ${
                            i === 0 || i === 6 ? 'text-[var(--text-secondary)]/70' : 'text-[var(--text-secondary)]'
                        }`}
                    >
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
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dayTasks = tasksByDay.get(key) ?? [];
                    const overflow = dayTasks.length - MAX_CHIPS_PER_DAY;
                    const isExpanded = expanded?.day === key && expanded?.month === monthKey;

                    // Subtle full-cell base: today gets a faint brand wash, weekends a
                    // faint neutral wash; both fall back to the plain background.
                    const cellBg = isToday
                        ? 'bg-[var(--brand-primary)]/[0.06]'
                        : isWeekend
                            ? 'bg-[var(--background-subtle)]'
                            : 'bg-[var(--background)]';

                    return (
                        <div
                            key={key}
                            className={`relative min-h-[100px] p-1.5 flex flex-col gap-1 transition-colors ${cellBg} ${
                                isToday ? 'ring-1 ring-inset ring-[var(--brand-primary)]/30' : ''
                            } ${isCurrentMonth ? '' : 'opacity-40'} ${
                                !isReadOnly ? 'cursor-pointer hover:bg-[var(--surface)]' : ''
                            }`}
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
                                        isOverdue={isTaskOverdue(task, key, today, todayMs)}
                                    />
                                </div>
                            ))}

                            {overflow > 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        // Reveal the full day list without triggering day-click-to-create.
                                        e.stopPropagation();
                                        setExpanded((cur) =>
                                            cur?.day === key && cur?.month === monthKey ? null : { day: key, month: monthKey },
                                        );
                                    }}
                                    aria-expanded={isExpanded}
                                    className="text-xs text-left pl-1 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                                >
                                    {isExpanded ? 'Show less' : `+${overflow} more`}
                                </button>
                            )}

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.14, ease: 'easeOut' }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute left-1 right-1 top-9 z-20 max-h-64 overflow-auto p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-lg flex flex-col gap-1"
                                    >
                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] px-1 pb-1">
                                            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        {dayTasks.map((task) => (
                                            <CalendarTaskChip
                                                key={task.id}
                                                task={task}
                                                onDragStart={onDragStart}
                                                onClick={(t) => {
                                                    closePopover();
                                                    onTaskClick(t);
                                                }}
                                                isReadOnly={isReadOnly}
                                                isOverdue={isTaskOverdue(task, key, today, todayMs)}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
