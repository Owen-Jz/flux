'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { TaskCard, TaskData, Member } from './task-card';

interface ColumnProps {
    id: string;
    title: string;
    tasks: TaskData[];
    isReadOnly?: boolean;
    isDragDisabled?: boolean;
    isAdmin?: boolean;
    currentUserId?: string;
    onAddTask?: () => void;
    onUpdateTask?: (taskId: string, data: Partial<TaskData>) => void;
    onDeleteTask?: (taskId: string) => void;
    onArchiveAll?: (taskIds: string[]) => void;
    members?: Member[];
    onTaskClick?: (task: TaskData) => void;
    categories?: { id: string; name: string; color: string }[];
    readTaskIds?: Set<string>;
}

const columnColors: Record<string, string> = {
    BACKLOG: 'bg-[var(--text-tertiary)]',
    TODO: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    REVIEW: 'bg-purple-500',
    DONE: 'bg-emerald-500',
};

export function Column({
    id,
    title,
    tasks,
    isReadOnly = false,
    isDragDisabled = false,
    isAdmin = false,
    currentUserId,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onArchiveAll,
    members = [],
    onTaskClick,
    categories = [],
    readTaskIds,
}: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col board-column h-full" id={`column-${id}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${columnColors[id] || 'bg-[var(--text-tertiary)]'}`} />
                    <h2 className="font-semibold text-xs text-[var(--text-primary)] truncate">
                        {title}
                    </h2>
                    <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--background-subtle)] px-1.5 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {id === 'DONE' && tasks.length > 0 && !isReadOnly && (
                        <button
                            onClick={() => onArchiveAll?.(tasks.map(t => t.id))}
                            className="p-2 md:p-1.5 min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg hover:bg-[var(--background-subtle)] transition-colors group"
                            title="Archive all tasks"
                        >
                            <ArchiveBoxIcon className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-emerald-600 transition-colors" />
                        </button>
                    )}
                    {!isReadOnly && (
                        <button
                            onClick={onAddTask}
                            className="add-task-btn p-2 md:p-1.5 min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                            id={`column-${id}-add-task`}
                        >
                            <PlusIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Task List - scrollable container */}
            <div
                ref={setNodeRef}
                className={`flex-1 flex flex-col gap-2 relative p-1.5 rounded-xl min-h-[60px] md:min-h-[100px] overflow-y-auto overflow-x-visible ring-2 ring-inset transition-[background-color,box-shadow] duration-150 ease-out ${
                    isOver
                        ? 'bg-[var(--brand-primary)]/10 ring-[var(--brand-primary)]/40'
                        : 'bg-[var(--background-subtle)]/50 ring-transparent'
                }`}
            >
                {/* Drop indicator — fades in immediately as a card enters this column */}
                <AnimatePresence>
                    {isOver && (
                        <motion.div
                            key="drop-indicator"
                            initial={{ opacity: 0, scaleX: 0.6 }}
                            animate={{ opacity: 0.55, scaleX: 1 }}
                            exit={{ opacity: 0, scaleX: 0.6 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            className="absolute left-2 right-2 top-1.5 h-1 origin-center bg-[var(--brand-primary)] rounded-full z-10"
                        />
                    )}
                </AnimatePresence>
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isReadOnly={isReadOnly}
                                isDragDisabled={isDragDisabled || (!isAdmin && !task.assignees.some(a => a.id === currentUserId))}
                                onUpdate={onUpdateTask}
                                onDelete={onDeleteTask}
                                members={members}
                                onClick={onTaskClick}
                                categories={categories}
                                isRead={readTaskIds?.has(task.id)}
                            />
                        ))}
                    </AnimatePresence>
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-12 text-xs text-[var(--text-secondary)]">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
