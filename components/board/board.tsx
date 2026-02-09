'use client';

import { useState, useOptimistic, useTransition, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Column } from './column';
import { TaskCard, TaskData, Member } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { updateTaskPosition, createTask, updateTask, deleteTask } from '@/actions/task';
import type { TaskStatus, TaskPriority } from '@/models/Task';
import { Plus, X, Loader2, Search, Filter, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditBoardModal from '../EditBoardModal';

interface BoardProps {
    initialTasks: TaskData[];
    workspaceSlug: string;
    boardSlug?: string;
    isReadOnly?: boolean;
    members?: Member[];
    boardName?: string;
    boardDescription?: string;
    boardColor?: string;
    categories?: { id: string; name: string; color: string }[];
    currentUserId?: string;
}

type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

const columns: { id: ColumnId; title: string }[] = [
    { id: 'BACKLOG', title: 'Backlog' },
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
];

export function Board({
    initialTasks,
    workspaceSlug,
    boardSlug,
    isReadOnly = false,
    members = [],
    boardName = 'Board',
    boardDescription = '',
    boardColor = '#3b82f6',
    categories = [],
    currentUserId,
}: BoardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMyTasks, setFilterMyTasks] = useState(false);
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL');
    const [filterMemberId, setFilterMemberId] = useState<string | 'ALL'>('ALL');
    const [filterCategoryId, setFilterCategoryId] = useState<string | 'ALL'>('ALL');
    const [isEditingBoard, setIsEditingBoard] = useState(false);
    const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
    const [localCategories, setLocalCategories] = useState(categories);

    // Sync state with props when initialTasks or categories changes
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);
    const [activeTask, setActiveTask] = useState<TaskData | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [isAddingTask, setIsAddingTask] = useState<ColumnId | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
    const [isPending, startTransition] = useTransition();

    type OptimisticAction =
        | { type: 'ADD'; task: TaskData }
        | { type: 'UPDATE'; task: TaskData }
        | { type: 'DELETE'; id: string }
        | { type: 'MOVE'; taskId: string; status: ColumnId; order: number };

    const [optimisticTasks, dispatchOptimistic] = useOptimistic(
        tasks,
        (state: TaskData[], action: OptimisticAction) => {
            switch (action.type) {
                case 'ADD':
                    return [...state, action.task];
                case 'UPDATE':
                    return state.map((t) => (t.id === action.task.id ? action.task : t));
                case 'DELETE':
                    return state.filter((t) => t.id !== action.id);
                case 'MOVE':
                    return state.map((t) =>
                        t.id === action.taskId
                            ? { ...t, status: action.status, order: action.order }
                            : t
                    );
                default:
                    return state;
            }
        }
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const filteredTasks = optimisticTasks.filter(task => {
        const matchesSearch = !searchQuery ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMyTasks = !filterMyTasks ||
            (currentUserId && task.assignees.some(a => a.id === currentUserId));

        const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;

        const matchesMember = filterMemberId === 'ALL' || task.assignees.some(a => a.id === filterMemberId);

        const matchesCategory = filterCategoryId === 'ALL' || task.categoryId === filterCategoryId;

        return matchesSearch && matchesMyTasks && matchesPriority && matchesMember && matchesCategory;
    });

    const getTasksByColumn = (columnId: string) => {
        return filteredTasks
            .filter((task) => task.status === columnId)
            .sort((a, b) => a.order - b.order);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        // Check if over is a column
        const isOverColumn = columns.some((col) => col.id === overId);

        if (isOverColumn) {
            // Moving to an empty column
            if (activeTask.status !== overId) {
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === activeId ? { ...t, status: overId } : t
                    )
                );
            }
        } else {
            // Moving over another task
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask && activeTask.status !== overTask.status) {
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === activeId ? { ...t, status: overTask.status } : t
                    )
                );
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        // Determine the target column
        const isOverColumn = columns.some((col) => col.id === overId);
        const targetColumn: ColumnId = (isOverColumn
            ? overId
            : tasks.find((t) => t.id === overId)?.status || activeTask.status) as ColumnId;

        // Get tasks in target column
        const columnTasks = tasks
            .filter((t) => t.status === targetColumn)
            .sort((a, b) => a.order - b.order);

        // Calculate new order
        let newOrder: number;
        if (isOverColumn || columnTasks.length === 0) {
            newOrder = columnTasks.length > 0 ? columnTasks[columnTasks.length - 1].order + 1000 : 1000;
        } else {
            const overIndex = columnTasks.findIndex((t) => t.id === overId);
            const activeIndex = columnTasks.findIndex((t) => t.id === activeId);

            if (activeIndex !== -1 && activeIndex !== overIndex) {
                const newColumnTasks = arrayMove(columnTasks, activeIndex, overIndex);
                const prevOrder = newColumnTasks[overIndex - 1]?.order ?? 0;
                const nextOrder = newColumnTasks[overIndex + 1]?.order ?? prevOrder + 2000;
                newOrder = (prevOrder + nextOrder) / 2;
            } else {
                newOrder = activeTask.order;
            }
        }

        // Optimistic update
        setTasks((prev) =>
            prev.map((t) =>
                t.id === activeId ? { ...t, status: targetColumn, order: newOrder } : t
            )
        );

        // Also update optimistic state to avoid flicker
        startTransition(() => {
            dispatchOptimistic({
                type: 'MOVE',
                taskId: activeId,
                status: targetColumn,
                order: newOrder
            });
        });

        // Persist to server
        startTransition(async () => {
            try {
                await updateTaskPosition(activeId, targetColumn as TaskStatus, newOrder);
            } catch (error) {
                console.error('Failed to update task position:', error);
                // Revert on error
                setTasks(initialTasks);
            }
        });
    };

    const handleAddTask = async (columnId: ColumnId) => {
        if (!newTaskTitle.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const newTask: TaskData = {
            id: tempId,
            title: newTaskTitle,
            status: columnId,
            priority: 'MEDIUM',
            order: Date.now(),
            assignees: [],
            createdAt: new Date().toISOString(),
        };

        setNewTaskTitle('');
        setNewTaskPriority('MEDIUM');
        setIsAddingTask(null);

        startTransition(async () => {
            dispatchOptimistic({ type: 'ADD', task: newTask });

            try {
                if (!boardSlug) {
                    throw new Error('Board slug is required');
                }
                const result = await createTask(workspaceSlug, boardSlug, {
                    title: newTask.title,
                    status: columnId,
                    priority: newTask.priority,
                });

                dispatchOptimistic({ type: 'DELETE', id: tempId });

                setTasks((prev) => [
                    ...prev.filter((t) => t.id !== tempId),
                    { ...newTask, id: result.id },
                ]);
            } catch (error) {
                console.error('Failed to create task:', error);
                setTasks((prev) => prev.filter((t) => t.id !== tempId));
            }
        });
    };

    const handleUpdateTask = async (taskId: string, data: Partial<TaskData>) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedTask = { ...task, ...data };

        // If currently selected task is updated, update selected task state too
        if (selectedTask?.id === taskId) {
            setSelectedTask(updatedTask);
        }

        startTransition(async () => {
            dispatchOptimistic({ type: 'UPDATE', task: updatedTask });
            setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

            try {
                await updateTask(taskId, {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    assignees: data.assignees?.map((a) => a.id),
                    subtasks: data.subtasks?.map(s => ({
                        id: s.id,
                        title: s.title,
                        completed: s.completed
                    })),
                    categoryId: data.categoryId,
                    status: data.status as TaskStatus,
                });
            } catch (error) {
                console.error('Failed to update task:', error);
                setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
            }
        });
    };

    const handleDeleteTask = async (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (selectedTask?.id === taskId) {
            setSelectedTask(null);
        }

        startTransition(async () => {
            dispatchOptimistic({ type: 'DELETE', id: taskId });
            setTasks((prev) => prev.filter((t) => t.id !== taskId));

            try {
                await deleteTask(taskId);
            } catch (error) {
                console.error('Failed to delete task:', error);
                setTasks((prev) => [...prev, task]);
            }
        });
    };

    return (
        <div className="h-full p-6 overflow-x-auto">
            {/* Board Header */}
            <div id="board-header" className="mb-8 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: boardColor }}
                        />
                        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                            {boardName}
                        </h1>
                    </div>
                    {boardDescription && (
                        <p className="text-[var(--text-secondary)] text-lg max-w-2xl font-normal ml-7">
                            {boardDescription}
                        </p>
                    )}
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => setIsEditingBoard(true)}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
                        title="Board Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                {/* Filters */}
                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input !pl-11 text-sm w-full sm:w-64"
                        />
                    </div>

                    {currentUserId && (
                        <button
                            onClick={() => setFilterMyTasks(!filterMyTasks)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${filterMyTasks
                                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                : 'bg-white text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            My Tasks
                        </button>
                    )}

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="HIGH">High Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="LOW">Low Priority</option>
                    </select>

                    <select
                        value={filterMemberId}
                        onChange={(e) => setFilterMemberId(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    >
                        <option value="ALL">All Members</option>
                        {members.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>

                    {localCategories.length > 0 && (
                        <select
                            value={filterCategoryId}
                            onChange={(e) => setFilterCategoryId(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                        >
                            <option value="ALL">All Categories</option>
                            {localCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Loader */}
                {isPending && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                // Only disable drag if search is active (priority/member filters allow drag)
                modifiers={searchQuery ? [] : undefined}
            >
                <div className="flex gap-6">
                    {columns.map((column) => (
                        <div key={column.id} className="flex flex-col">
                            <Column
                                id={column.id}
                                title={column.title}
                                tasks={getTasksByColumn(column.id)}
                                isReadOnly={isReadOnly}
                                isDragDisabled={!!searchQuery}
                                onAddTask={() => setIsAddingTask(column.id)}
                                onUpdateTask={handleUpdateTask}
                                onDeleteTask={handleDeleteTask}
                                members={members}
                                onTaskClick={(task) => setSelectedTask(task)}
                                categories={categories}
                            />

                            {/* Add Task Form */}
                            <AnimatePresence>
                                {isAddingTask === column.id && !isReadOnly && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3"
                                    >
                                        <div className="card p-3">
                                            <div className="flex flex-col gap-3">
                                                <input
                                                    type="text"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAddTask(column.id);
                                                        if (e.key === 'Escape') setIsAddingTask(null);
                                                    }}
                                                    placeholder="Task title..."
                                                    className="input text-sm"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setNewTaskPriority(p)}
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${newTaskPriority === p
                                                                ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                                                                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleAddTask(column.id)}
                                                    className="btn btn-primary text-xs py-1.5"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => setIsAddingTask(null)}
                                                    className="btn btn-secondary text-xs py-1.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div className="rotate-3">
                            <TaskCard task={activeTask} isReadOnly isOverlay categories={localCategories} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        isOpen={!!selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={handleUpdateTask}
                        members={members}
                        isReadOnly={isReadOnly}
                        categories={localCategories}
                    />
                )}
            </AnimatePresence>

            {isEditingBoard && (
                <EditBoardModal
                    workspaceSlug={workspaceSlug}
                    board={{
                        id: 'board-id',
                        name: boardName,
                        slug: boardSlug || '',
                        description: boardDescription,
                        color: boardColor,
                        categories: localCategories,
                    }}
                    onClose={() => setIsEditingBoard(false)}
                    onCategoriesChange={(updatedCategories) => setLocalCategories(updatedCategories)}
                />
            )}
        </div>
    );
}
