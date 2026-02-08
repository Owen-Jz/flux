'use client';

import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TaskCard, TaskData, Member } from './task-card';

interface ColumnProps {
    id: string;
    title: string;
    tasks: TaskData[];
    isReadOnly?: boolean;
    isDragDisabled?: boolean; // New prop
    onAddTask?: () => void;
    onUpdateTask?: (taskId: string, data: Partial<TaskData>) => void;
    onDeleteTask?: (taskId: string) => void;
    members?: Member[];
    onTaskClick?: (task: TaskData) => void;
}

const columnColors: Record<string, string> = {
    BACKLOG: 'bg-slate-400',
    TODO: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    DONE: 'bg-emerald-500',
};

export function Column({
    id,
    title,
    tasks,
    isReadOnly = false,
    isDragDisabled = false,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    members = [],
    onTaskClick,
}: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col w-80 flex-shrink-0 board-column">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${columnColors[id] || 'bg-gray-400'}`} />
                    <h2 className="font-semibold text-sm text-[var(--foreground)]">
                        {title}
                    </h2>
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={onAddTask}
                        className="add-task-btn p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    >
                        <Plus className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                )}
            </div>

            {/* Task List */}
            <div
                ref={setNodeRef}
                className={`flex-1 space-y-3 p-2 rounded-xl transition-colors min-h-[200px] ${isOver ? 'bg-[var(--brand-primary)]/5 ring-2 ring-[var(--brand-primary)]/20' : 'bg-[var(--surface)]/50'
                    }`}
            >
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isReadOnly={isReadOnly}
                            isDragDisabled={isDragDisabled}
                            onUpdate={onUpdateTask}
                            onDelete={onDeleteTask}
                            members={members}
                            onClick={onTaskClick}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-sm text-[var(--text-secondary)]">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
