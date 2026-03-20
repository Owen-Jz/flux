'use client';

import { useState, useOptimistic, useTransition, useEffect, useMemo, useCallback } from 'react';
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
import { CreateTaskModal } from './create-task-modal';
import { AIDecomposeModal } from './ai-decompose-modal';
import { updateTaskPosition, createTask, updateTask, deleteTask } from '@/actions/task';
import { updateOnboardingProgress } from '@/actions/onboarding';
import type { TaskStatus, TaskPriority } from '@/models/Task';
import { PlusIcon, XMarkIcon, ArrowPathIcon, MagnifyingGlassIcon, UserIcon, Cog6ToothIcon, UsersIcon, BellIcon, ChatBubbleLeftRightIcon, MoonIcon, SunIcon, ChevronDownIcon, EllipsisHorizontalIcon, SparklesIcon, FunnelIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import EditBoardModal from '../EditBoardModal';
import CustomSelect from '../ui/custom-select';
import { useSocket } from '@/contexts/socket-context';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface BoardProps {
    initialTasks: TaskData[];
    workspaceSlug: string;
    boardSlug?: string;
    boardId?: string;
    isReadOnly?: boolean;
    members?: Member[];
    boardName?: string;
    boardDescription?: string;
    boardColor?: string;
    categories?: { id: string; name: string; color: string }[];
    currentUserId?: string;
}

type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

const columns: { id: ColumnId; title: string }[] = [
    { id: 'BACKLOG', title: 'Backlog' },
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'REVIEW', title: 'Review' },
    { id: 'DONE', title: 'Done' },
];

export function Board({
    initialTasks,
    workspaceSlug,
    boardSlug,
    boardId,
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

    // Socket real-time handling
    const {
        isConnected,
        onlineUsers,
        emitTaskMoved,
        emitTaskUpdated,
        emitTaskCreated,
        emitTaskDeleted,
        onTaskMoved,
        onTaskUpdated,
        onTaskCreated,
        onTaskDeleted,
    } = useSocket();

    // Listen for remote task moves
    useEffect(() => {
        if (!boardId || isReadOnly) return;

        const unsubscribe = onTaskMoved((data) => {
            // Don't process our own moves
            if (data.movedBy?.id === currentUserId) return;

            setTasks((prev) =>
                prev.map((t) =>
                    t.id === data.taskId
                        ? { ...t, status: data.toColumn as TaskStatus, order: data.newIndex }
                        : t
                )
            );
        });

        return unsubscribe;
    }, [boardId, isReadOnly, currentUserId, onTaskMoved]);

    // Listen for remote task updates
    useEffect(() => {
        if (!boardId || isReadOnly) return;

        const unsubscribe = onTaskUpdated((data) => {
            // Don't process our own updates
            if (data.updatedBy?.id === currentUserId) return;

            setTasks((prev) =>
                prev.map((t) =>
                    t.id === data.taskId ? { ...t, ...data.updates } : t
                )
            );
        });

        return unsubscribe;
    }, [boardId, isReadOnly, currentUserId, onTaskUpdated]);

    // Listen for remote task creation
    useEffect(() => {
        if (!boardId || isReadOnly) return;

        const unsubscribe = onTaskCreated((data) => {
            // Don't process our own creates
            if (data.createdBy?.id === currentUserId) return;

            if (data.task) {
                setTasks((prev) => [...prev, data.task as unknown as TaskData]);
            }
        });

        return unsubscribe;
    }, [boardId, isReadOnly, currentUserId, onTaskCreated]);

    // Listen for remote task deletion
    useEffect(() => {
        if (!boardId || isReadOnly) return;

        const unsubscribe = onTaskDeleted((data) => {
            // Don't process our own deletes
            if (data.deletedBy?.id === currentUserId) return;

            setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
        });

        return unsubscribe;
    }, [boardId, isReadOnly, currentUserId, onTaskDeleted]);

    const [activeTask, setActiveTask] = useState<TaskData | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [isAddingTask, setIsAddingTask] = useState<ColumnId | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIDecomposeModal, setShowAIDecomposeModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
    const [showSearch, setShowSearch] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { theme, setTheme } = useTheme();

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

    const filteredTasks = useMemo(() => {
        const lowerSearchQuery = searchQuery.toLowerCase();
        return optimisticTasks.filter(task => {
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(lowerSearchQuery) ||
                task.description?.toLowerCase().includes(lowerSearchQuery);

            const matchesMyTasks = !filterMyTasks ||
                (currentUserId && task.assignees.some(a => a.id === currentUserId));

            const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;

            const matchesMember = filterMemberId === 'ALL' || task.assignees.some(a => a.id === filterMemberId);

            const matchesCategory = filterCategoryId === 'ALL' || task.categoryId === filterCategoryId;

            return matchesSearch && matchesMyTasks && matchesPriority && matchesMember && matchesCategory;
        });
    }, [optimisticTasks, searchQuery, filterMyTasks, filterPriority, filterMemberId, filterCategoryId, currentUserId]);

    const getTasksByColumn = useCallback((columnId: string) => {
        return filteredTasks
            .filter((task) => task.status === columnId)
            .sort((a, b) => a.order - b.order);
    }, [filteredTasks]);

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

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskMoved({
                        taskId: activeId,
                        fromColumn: activeTask.status,
                        toColumn: targetColumn,
                        newIndex: newOrder,
                    });
                }

                // Track onboarding progress - drag and drop
                await updateOnboardingProgress('completedFirstDragDrop');
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

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskCreated({
                        task: { ...newTask, id: result.id },
                    });
                }

                // Track onboarding progress
                await updateOnboardingProgress('createdFirstTask');
            } catch (error) {
                console.error('Failed to create task:', error);
                setTasks((prev) => prev.filter((t) => t.id !== tempId));
            }
        });
    };

    const handleCreateTaskFromModal = async (taskData: {
        title: string;
        description?: string;
        priority: TaskPriority;
        status: TaskStatus;
        assignees: Member[];
    }) => {
        const columnId = taskData.status as ColumnId;
        const tempId = `temp-${Date.now()}`;
        const newTask: TaskData = {
            id: tempId,
            title: taskData.title,
            description: taskData.description,
            status: columnId,
            priority: taskData.priority,
            order: Date.now(),
            assignees: taskData.assignees,
            createdAt: new Date().toISOString(),
        };

        startTransition(async () => {
            dispatchOptimistic({ type: 'ADD', task: newTask });

            try {
                if (!boardSlug) {
                    throw new Error('Board slug is required');
                }
                const result = await createTask(workspaceSlug, boardSlug, {
                    title: taskData.title,
                    description: taskData.description,
                    status: columnId,
                    priority: taskData.priority,
                    assignees: taskData.assignees.map(a => a.id),
                });

                dispatchOptimistic({ type: 'DELETE', id: tempId });

                setTasks((prev) => [
                    ...prev.filter((t) => t.id !== tempId),
                    { ...newTask, id: result.id },
                ]);

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskCreated({
                        task: { ...newTask, id: result.id },
                    });
                }
            } catch (error) {
                console.error('Failed to create task:', error);
                dispatchOptimistic({ type: 'DELETE', id: tempId });
            }
        });
    };

    // Handle task creation from AI Decompose modal
    const handleCreateTaskFromAI = async (taskData: {
        title: string;
        description: string;
        subtasks: { title: string; completed: boolean }[];
    }) => {
        const columnId = 'BACKLOG' as ColumnId;
        const tempId = `temp-${Date.now()}`;
        const subtasksWithIds = taskData.subtasks.map((s, i) => ({
            id: `temp-subtask-${Date.now()}-${i}`,
            ...s,
        }));
        const newTask: TaskData = {
            id: tempId,
            title: taskData.title,
            description: taskData.description,
            status: columnId,
            priority: 'MEDIUM' as TaskPriority,
            order: Date.now(),
            assignees: [],
            createdAt: new Date().toISOString(),
            subtasks: subtasksWithIds,
        };

        startTransition(async () => {
            dispatchOptimistic({ type: 'ADD', task: newTask });

            try {
                if (!boardSlug) {
                    throw new Error('Board slug is required');
                }
                const result = await createTask(workspaceSlug, boardSlug, {
                    title: taskData.title,
                    description: taskData.description,
                    status: columnId,
                    priority: 'MEDIUM',
                    assignees: [],
                    subtasks: subtasksWithIds,
                });

                dispatchOptimistic({ type: 'DELETE', id: tempId });

                setTasks((prev) => [
                    ...prev.filter((t) => t.id !== tempId),
                    { ...newTask, id: result.id },
                ]);

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskCreated({
                        task: { ...newTask, id: result.id },
                    });
                }
            } catch (error) {
                console.error('Failed to create task:', error);
                dispatchOptimistic({ type: 'DELETE', id: tempId });
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

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskUpdated({
                        taskId,
                        updates: data,
                    });
                }
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

                // Emit socket event for real-time sync
                if (boardId) {
                    emitTaskDeleted({ taskId });
                }
            } catch (error) {
                console.error('Failed to delete task:', error);
                setTasks((prev) => [...prev, task]);
            }
        });
    };

    return (
        <div className="min-h-full p-3 md:p-4 overflow-x-auto md:overflow-x-hidden flex flex-col">
            {/* Enhanced Navigation Bar */}
            <div id="board-header" className="mb-4 flex items-center justify-between gap-3">
                {/* Left: Board Title & Color indicator */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Board Color Dot & Name */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full flex-shrink-0 ring-2 ring-[var(--background)]"
                            style={{ backgroundColor: boardColor }}
                        />
                        <h1 className="text-lg md:text-xl font-bold text-[var(--foreground)] tracking-tight truncate">
                            {boardName}
                        </h1>
                    </div>
                </div>

                {/* Right: Primary Actions & Tools */}
                <div className="flex items-center gap-2">
                    {/* Primary Actions - Add Task */}
                    {!isReadOnly && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs md:text-sm font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Task</span>
                        </button>
                    )}

                    {/* AI Decompose Button */}
                    {!isReadOnly && (
                        <button
                            onClick={() => setShowAIDecomposeModal(true)}
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs md:text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors shadow-sm"
                            title="AI Decompose Task"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span>AI Decompose</span>
                        </button>
                    )}

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-[var(--border-subtle)] mx-1" />

                    {/* Online Users */}
                    {onlineUsers.length > 0 && (
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center -space-x-2">
                                {onlineUsers.slice(0, 4).map((user) => (
                                    <div
                                        key={user.socketId}
                                        className="relative group"
                                    >
                                        {user.image ? (
                                            <img
                                                src={user.image}
                                                alt={user.name}
                                                className="w-7 h-7 rounded-full border-2 border-[var(--background)]"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full border-2 border-[var(--background)] bg-[var(--brand-primary)] flex items-center justify-center text-white text-[10px] font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-[var(--surface)] px-1.5 py-0.5 rounded">
                                            {user.name}
                                        </span>
                                    </div>
                                ))}
                                {onlineUsers.length > 4 && (
                                    <div className="w-7 h-7 rounded-full border-2 border-[var(--background)] bg-[var(--surface)] flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                                        +{onlineUsers.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions - Icon Buttons */}
                    <div className="flex items-center gap-0.5">
                        {/* Settings */}
                        {!isReadOnly && (
                            <button
                                onClick={() => setIsEditingBoard(true)}
                                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
                                title="Board Settings"
                            >
                                <Cog6ToothIcon className="w-4.5 h-4.5" />
                            </button>
                        )}

                        {/* Comments */}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors relative"
                            title="Comments"
                        >
                            <ChatBubbleLeftRightIcon className="w-4.5 h-4.5" />
                        </button>

                        {/* Notifications */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors relative"
                            title="Notifications"
                        >
                            <BellIcon className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-2">
                {/* Left: Search */}
                <div className="relative w-full sm:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input !pl-10 text-sm w-full"
                    />
                </div>

                {/* Right: Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Active Filters Summary */}
                    {((searchQuery || filterMyTasks || filterPriority !== 'ALL' || filterMemberId !== 'ALL' || filterCategoryId !== 'ALL')) && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterMyTasks(false);
                                setFilterPriority('ALL');
                                setFilterMemberId('ALL');
                                setFilterCategoryId('ALL');
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Clear filters
                        </button>
                    )}

                    {currentUserId && (
                        <button
                            onClick={() => setFilterMyTasks(!filterMyTasks)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${filterMyTasks
                                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--background-subtle)]'
                                }`}
                        >
                            <UserIcon className="w-3.5 h-3.5" />
                            My Tasks
                        </button>
                    )}

                    <CustomSelect
                        value={filterPriority}
                        onChange={(value) => setFilterPriority(value as TaskPriority | 'ALL')}
                        options={[
                            { value: 'ALL', label: 'All Priorities' },
                            { value: 'HIGH', label: 'High' },
                            { value: 'MEDIUM', label: 'Medium' },
                            { value: 'LOW', label: 'Low' },
                        ]}
                        minWidth="130px"
                    />

                    <CustomSelect
                        value={filterMemberId}
                        onChange={setFilterMemberId}
                        options={[
                            { value: 'ALL', label: 'All Members' },
                            ...members.map(member => ({ value: member.id, label: member.name }))
                        ]}
                        minWidth="130px"
                    />

                    {localCategories.length > 0 && (
                        <CustomSelect
                            value={filterCategoryId}
                            onChange={setFilterCategoryId}
                            options={[
                                { value: 'ALL', label: 'All Categories' },
                                ...localCategories.map(cat => ({ value: cat.id, label: cat.name }))
                            ]}
                            minWidth="140px"
                        />
                    )}
                </div>

                {/* Loader */}
                {isPending && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-secondary)]">
                        <ArrowPathIcon className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                        <span className="hidden sm:inline">Syncing...</span>
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                modifiers={searchQuery ? [] : undefined}
            >
                {/* Responsive columns container - all columns fit within viewport */}
                <div className="flex gap-2 md:gap-3 pb-4 w-full min-w-0">
                    {columns.map((column) => (
                        <div key={column.id} className="flex flex-col flex-1 min-w-[140px] sm:min-w-[160px] md:min-w-[200px] max-w-[280px] md:max-w-[320px]">
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
                                                    <PlusIcon className="w-3 h-3" />
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => setIsAddingTask(null)}
                                                    className="btn btn-secondary text-xs py-1.5"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
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
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0.8 }}
                            animate={{ scale: 1.02, opacity: 1, rotate: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] ring-2 ring-[var(--brand-primary)]/30 rounded-lg"
                        >
                            <TaskCard task={activeTask} isReadOnly isOverlay categories={localCategories} />
                        </motion.div>
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

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateTaskFromModal}
                members={members}
                columns={columns}
                defaultColumn="TODO"
            />

            <AIDecomposeModal
                isOpen={showAIDecomposeModal}
                onClose={() => setShowAIDecomposeModal(false)}
                onSubmit={handleCreateTaskFromAI}
                boardId={boardId || ''}
            />

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

            {/* Comments Panel */}
            {showComments && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setShowComments(false)}
                    />
                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 w-full md:w-96 max-w-full bg-[var(--surface)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--foreground)]">Comments</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Recent activity</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowComments(false)}
                                className="p-2 hover:bg-[var(--background-subtle)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto mb-4">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--brand-primary)]/50" />
                                </div>
                                <h4 className="font-semibold text-[var(--foreground)] mb-2">No comments yet</h4>
                                <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                                    Click on any task to view or add comments. All comments on this board will appear here.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Notifications Panel */}
            {showNotifications && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setShowNotifications(false)}
                    />
                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 w-full md:w-96 max-w-full bg-[var(--surface)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <BellIcon className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--foreground)]">Notifications</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Stay updated</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="p-2 hover:bg-[var(--background-subtle)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                    <BellIcon className="w-8 h-8 text-purple-500/50" />
                                </div>
                                <h4 className="font-semibold text-[var(--foreground)] mb-2">All caught up!</h4>
                                <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                                    You'll receive notifications for task assignments, mentions, due dates, and more.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-subtle)]">
                            <button className="w-full py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] rounded-xl transition-colors">
                                Notification settings
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
