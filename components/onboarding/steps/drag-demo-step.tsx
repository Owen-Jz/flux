'use client';

import { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Bars3BottomLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface DragDemoStepProps {
    onComplete: () => void;
    onSkip: () => void;
}

interface SampleTask {
    id: string;
    title: string;
    status: string;
}

function DraggableTask({ task }: { task: SampleTask }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg cursor-grab active:cursor-grabbing hover:border-[var(--brand-primary)]/50 transition-colors"
        >
            <p className="text-sm text-[var(--foreground)]">{task.title}</p>
        </div>
    );
}

function DroppableColumn({
    id,
    title,
    children,
    isOver,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
    isOver: boolean;
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-h-[120px] p-2 rounded-lg transition-all ${
                isOver
                    ? 'bg-[var(--brand-primary)]/10 ring-2 ring-[var(--brand-primary)]/30'
                    : 'bg-[var(--background-subtle)]/50'
            }`}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <div
                    className={`w-1.5 h-1.5 rounded-full ${
                        id === 'BACKLOG'
                            ? 'bg-[var(--text-tertiary)]'
                            : id === 'TODO'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                    }`}
                />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{title}</span>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

export function DragDemoStep({ onComplete, onSkip }: DragDemoStepProps) {
    const [tasks] = useState<SampleTask[]>([
        { id: 'task-1', title: 'Sample task', status: 'BACKLOG' },
        { id: 'task-2', title: 'Another task', status: 'TODO' },
        { id: 'task-3', title: 'Done task', status: 'DONE' },
    ]);
    const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({
        'task-1': 'BACKLOG',
        'task-2': 'TODO',
        'task-3': 'DONE',
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string | null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Check if dropped on a column
        const isOverColumn = ['BACKLOG', 'TODO', 'DONE'].includes(overId);
        if (!isOverColumn) return;

        const newStatus = overId;

        // Update local state
        setTaskStatuses((prev) => ({ ...prev, [taskId]: newStatus }));

        // Check if this is a column change
        const oldStatus = taskStatuses[taskId];
        if (oldStatus !== newStatus) {
            // Mark as complete
            await updateOnboardingProgress('completedFirstDragDrop');
            setShowSuccess(true);
            setTimeout(onComplete, 1000);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setOverId(null);
    };

    const activeTask = tasks.find((t) => t.id === activeId);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[var(--flux-success-bg)]">
                    <Bars3BottomLeftIcon className="w-7 h-7 text-[var(--flux-success-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Try Drag and Drop</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Drag the task card to a different column to change its status.
                </p>
            </div>

            {/* Mini Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="flex gap-3">
                    <DroppableColumn id="BACKLOG" title="Backlog" isOver={overId === 'BACKLOG'}>
                        {tasks
                            .filter((t) => taskStatuses[t.id] === 'BACKLOG')
                            .map((task) => (
                                <DraggableTask key={task.id} task={task} />
                            ))}
                    </DroppableColumn>

                    <DroppableColumn id="TODO" title="To Do" isOver={overId === 'TODO'}>
                        {tasks
                            .filter((t) => taskStatuses[t.id] === 'TODO')
                            .map((task) => (
                                <DraggableTask key={task.id} task={task} />
                            ))}
                    </DroppableColumn>

                    <DroppableColumn id="DONE" title="Done" isOver={overId === 'DONE'}>
                        {tasks
                            .filter((t) => taskStatuses[t.id] === 'DONE')
                            .map((task) => (
                                <DraggableTask key={task.id} task={task} />
                            ))}
                    </DroppableColumn>
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div className="p-3 bg-[var(--surface)] border border-[var(--brand-primary)] rounded-lg shadow-xl cursor-grabbing">
                            <p className="text-sm text-[var(--foreground)]">{activeTask.title}</p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Success indicator */}
            {showSuccess && (
                <div className="flex items-center justify-center gap-2 p-3 bg-[var(--flux-success-bg)] rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-[var(--flux-success-primary)]" />
                    <span className="text-sm font-medium text-[var(--flux-success-text-strong)]">
                        Great job! Drag and drop complete.
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onSkip}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--background-subtle)]"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}