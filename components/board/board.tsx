'use client';

import { useState, useOptimistic, useTransition, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
    type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './column';
import { TaskCard, TaskData, Member } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { CreateTaskModal } from './create-task-modal';
import { PlanWithAIModal } from './plan-with-ai-modal';
import { PlanStreamBanner } from './plan-stream-banner';
import { PlanCompleteModal } from './plan-complete-modal';
import { usePlanStream } from './use-plan-stream';
import { undoAIPlan } from '@/actions/ai-plan';
import { getPlanLoadingMessages } from '@/lib/plan-loading-messages';
import type { BoardStreamRequest, StreamedTask } from '@/types/ai-plan';
import { updateTaskPosition, createTask, updateTask, deleteTask, archiveTasks } from '@/actions/task';
import { updateOnboardingProgress } from '@/actions/onboarding';
import { InteractiveBoardWalkthrough, dispatchWalkthroughEvent } from '@/components/onboarding/interactive-board-walkthrough';
import { BoardContextualTooltips } from './board-contextual-tooltips';
import { CommentsPanel, NotificationsPanel } from './board-activity-panels';
import { getUnreadActivityCountForBoard } from '@/actions/activity';
import type { TaskStatus, TaskPriority } from '@/models/Task';
import { PlusIcon, XMarkIcon, ArrowPathIcon, MagnifyingGlassIcon, UserIcon, Cog6ToothIcon, UsersIcon, BellIcon, ChatBubbleLeftRightIcon, MoonIcon, SunIcon, ChevronDownIcon, EllipsisHorizontalIcon, SparklesIcon, FunnelIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import EditBoardModal from '../EditBoardModal';
import CustomSelect from '../ui/custom-select';
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
    isAdmin?: boolean;
    /** Full workspace role — threaded into the board-settings modal so its
     *  admin-only Access tab renders for admins. */
    userRole?: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
    hasUnread?: React.ReactNode;
    isInWalkthrough?: boolean;
}

type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

const columns: { id: ColumnId; title: string }[] = [
    { id: 'BACKLOG', title: 'Backlog' },
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'REVIEW', title: 'Review' },
    { id: 'DONE', title: 'Done' },
];

const columnIdSet = new Set<string>(columns.map((c) => c.id));

// Pointer-first collision detection. `closestCorners` resolved the drop target by
// the dragged card's geometry, so a card would "stick" to the nearest column
// rather than the one under the cursor. `pointerWithin` makes the column the
// pointer is actually inside the target — so the highlight + drop follow the
// cursor immediately. We still prefer a task card under the pointer (precise
// reordering) and fall back to the column droppable for empty-area drops.
const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    const collisions = pointer.length > 0 ? pointer : rectIntersection(args);
    if (collisions.length === 0) return collisions;
    const cardCollision = collisions.find((c) => !columnIdSet.has(c.id as string));
    return [cardCollision ?? collisions[0]];
};

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
    isAdmin = false,
    userRole = null,
    hasUnread,
    isInWalkthrough = false,
}: BoardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMyTasks, setFilterMyTasks] = useState(false);
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL');
    const [filterMemberId, setFilterMemberId] = useState<string | 'ALL'>('ALL');
    const [filterCategoryId, setFilterCategoryId] = useState<string | 'ALL'>('ALL');
    const [isEditingBoard, setIsEditingBoard] = useState(false);
    const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
    const [localCategories, setLocalCategories] = useState(categories);

    // Tracks whether an AI plan is mid-flight (or awaiting keep/undo) so prop
    // syncs don't clobber the optimistic cards we're streaming in. Kept current
    // by an effect declared once `planStream` exists, below.
    const isStreamingRef = useRef(false);
    // Timers for staggered streamed-card insertion (cleaned up on unmount).
    const streamInsertTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    useEffect(() => () => { streamInsertTimers.current.forEach(clearTimeout); }, []);

    // Sync state with props when initialTasks changes — but never while a plan is
    // streaming, or a mid-stream revalidation would wipe the cards being inserted.
    useEffect(() => {
        if (isStreamingRef.current) return;
        setTasks(initialTasks);
    }, [initialTasks]);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    // Unread-activity badge on the bell. Refreshed on mount and whenever the
    // notifications panel reports it cleared items.
    const refreshUnreadCount = useCallback(() => {
        if (!boardSlug) return;
        getUnreadActivityCountForBoard(workspaceSlug, boardSlug)
            .then(setBoardUnreadCount)
            .catch(() => {
                /* badge is best-effort; ignore transient failures */
            });
    }, [workspaceSlug, boardSlug]);

    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    // Open a task's detail modal from an activity/comment entry (by id), closing
    // whichever side panel triggered it. Marks the task locally read.
    const handleOpenTaskById = useCallback((taskId?: string) => {
        if (!taskId) return;
        const target = tasks.find((t) => t.id === taskId);
        setShowComments(false);
        setShowNotifications(false);
        if (target) {
            setSelectedTask(target);
            setReadTaskIds((prev) => new Set([...prev, target.id]));
        }
    }, [tasks]);

    const [activeTask, setActiveTask] = useState<TaskData | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [readTaskIds, setReadTaskIds] = useState<Set<string>>(new Set());
    const [isAddingTask, setIsAddingTask] = useState<ColumnId | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPlanWithAI, setShowPlanWithAI] = useState(false);
    const [showPlanComplete, setShowPlanComplete] = useState(false);
    const [undoError, setUndoError] = useState<string | null>(null);
    const [pendingPlanPrompt, setPendingPlanPrompt] = useState<string | null>(null);
    // Domain-aware loading phrases shown in the stream banner before sections arrive.
    const [streamLoadingMessages, setStreamLoadingMessages] = useState<string[]>([]);

    // If the visitor typed a project on the marketing hero before signing up,
    // pick it up here (once) and open Plan with AI pre-filled with their idea.
    useEffect(() => {
        if (isReadOnly) return;
        let prompt: string | null = null;
        try {
            prompt = sessionStorage.getItem('flux_pending_plan');
            if (prompt) sessionStorage.removeItem('flux_pending_plan');
        } catch {
            /* sessionStorage unavailable */
        }
        if (prompt && prompt.trim()) {
            setPendingPlanPrompt(prompt.trim());
            setShowPlanWithAI(true);
        }
        // Run once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Append streamed AI tasks into board state as real cards. Insertion is
    // staggered (~70ms/card) so a section's batch streams in card-by-card and each
    // card plays its own enter animation — instead of a whole block landing in one
    // frame and snapping the column's height.
    const handleStreamedTasks = useCallback((streamed: StreamedTask[]) => {
        const toCard = (t: StreamedTask): TaskData => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            estimatedHours: t.estimatedHours,
            order: t.order,
            assignees: [],
            createdAt: new Date().toISOString(),
        });
        streamed.forEach((t, i) => {
            const card = toCard(t);
            const timer = setTimeout(() => {
                setTasks((prev) => (prev.some((p) => p.id === card.id) ? prev : [...prev, card]));
            }, i * 70);
            streamInsertTimers.current.push(timer);
        });
    }, []);

    const planStream = usePlanStream({
        onTasks: handleStreamedTasks,
    });

    // Open the completion modal once the stream reaches a terminal state with
    // created tasks — deterministic for both a clean finish and a cancellation
    // (a cancelled stream may never deliver the final `done` event).
    useEffect(() => {
        if (
            (planStream.state.phase === 'done' || planStream.state.phase === 'cancelled') &&
            planStream.state.createdTaskIds.length > 0
        ) {
            setShowPlanComplete(true);
        }
    }, [planStream.state.phase, planStream.state.createdTaskIds.length]);

    // Mirror the stream phase into a ref the prop-sync effect can read without
    // re-subscribing. Stays "active" through the done/cancelled review window so a
    // late revalidation can't wipe freshly-streamed cards before the user decides.
    useEffect(() => {
        isStreamingRef.current = planStream.state.phase !== 'idle';
    }, [planStream.state.phase]);

    const handleStartBoardStream = useCallback((req: BoardStreamRequest) => {
        // Never stack a second stream on top of an in-flight one — that would
        // orphan the first run's tasks from Undo and double-write the board.
        if (planStream.state.phase === 'streaming') return;
        setStreamLoadingMessages(getPlanLoadingMessages(req.description));
        planStream.start(req);
    }, [planStream]);

    const handleUndoAIPlan = useCallback(async () => {
        const ids = planStream.state.createdTaskIds;
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        const removed = tasks.filter((t) => idSet.has(t.id));
        setUndoError(null);
        // Optimistic removal — keep the modal open until we know it succeeded.
        // On failure, restore only the cards that aren't already present (no
        // duplicates) and re-sort by order so they return to their positions
        // rather than getting appended to the end.
        const restore = () =>
            setTasks((prev) => {
                const present = new Set(prev.map((t) => t.id));
                const toRestore = removed.filter((t) => !present.has(t.id));
                if (toRestore.length === 0) return prev;
                return [...prev, ...toRestore].sort((a, b) => a.order - b.order);
            });
        setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
        try {
            const result = await undoAIPlan(workspaceSlug, boardSlug || '', ids);
            if (!result.success) {
                restore();
                setUndoError(result.error || 'Could not undo the plan. Please try again.');
                return;
            }
            setShowPlanComplete(false);
            planStream.reset();
        } catch {
            restore();
            setUndoError('Could not undo the plan. Please try again.');
        }
    }, [planStream, tasks, workspaceSlug, boardSlug]);

    const handleKeepPlan = useCallback(() => {
        setShowPlanComplete(false);
        setUndoError(null);
        planStream.reset();
    }, [planStream]);

    // A plan is "busy" while it's actively streaming or its results are awaiting
    // keep/undo. The Plan-with-AI triggers are disabled during this window so a
    // second plan can't be generated on top of the current one.
    const planBusy = planStream.state.phase === 'streaming' || showPlanComplete;
    const openPlanWithAI = useCallback(() => {
        if (planStream.state.phase === 'streaming' || showPlanComplete) return;
        setShowPlanWithAI(true);
    }, [planStream.state.phase, showPlanComplete]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
    const [showSearch, setShowSearch] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [boardUnreadCount, setBoardUnreadCount] = useState(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { theme, setTheme } = useTheme();
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [walkthroughStarted, setWalkthroughStarted] = useState(false);

    // Check if walkthrough should be shown (eligible for onboarding, not completed)
    useEffect(() => {
        if (isInWalkthrough && !walkthroughStarted && tasks.length > 0) {
            // Small delay to let the board render first
            const timer = setTimeout(() => {
                setShowWalkthrough(true);
                setWalkthroughStarted(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isInWalkthrough, walkthroughStarted, tasks.length]);

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
        // Mouse/trackpad: an 8px movement threshold starts the drag immediately
        // (the old `delay: 200` here was an invalid key on the distance constraint
        // and made desktop drags feel sticky).
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        // Touch: a short press-and-hold so vertical scrolling a column doesn't
        // accidentally start a drag.
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 8 },
        }),
        // Keyboard accessibility for drag-and-drop.
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // A solo board (you're the only member) makes assignee-based controls
    // meaningless — every task is yours. We hide those controls and, defensively,
    // ignore their state in the predicate so a filter left over from when the
    // board had more members can never strand tasks out of view.
    const isSoloBoard = members.length <= 1;

    const filteredTasks = useMemo(() => {
        const lowerSearchQuery = searchQuery.toLowerCase();
        return optimisticTasks.filter(task => {
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(lowerSearchQuery) ||
                task.description?.toLowerCase().includes(lowerSearchQuery);

            const matchesMyTasks = isSoloBoard || !filterMyTasks ||
                (currentUserId && task.assignees.some(a => a.id === currentUserId));

            const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;

            const matchesMember = isSoloBoard || filterMemberId === 'ALL' || task.assignees.some(a => a.id === filterMemberId);

            const matchesCategory = filterCategoryId === 'ALL' || task.categoryId === filterCategoryId;

            return matchesSearch && matchesMyTasks && matchesPriority && matchesMember && matchesCategory;
        });
    }, [optimisticTasks, searchQuery, filterMyTasks, filterPriority, filterMemberId, filterCategoryId, currentUserId, isSoloBoard]);

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

        // Enforce move permission: only admins can move any card; others only their own
        if (!isAdmin && !activeTask.assignees.some((a) => a.id === currentUserId)) {
            setActiveTask(null);
            return;
        }

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

        // Snapshot the task's original position before the optimistic update
        const originalStatus = activeTask.status;
        const originalOrder = activeTask.order;

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

                // Track onboarding progress - drag and drop
                await updateOnboardingProgress('completedFirstDragDrop');

                // Dispatch walkthrough event for interactive onboarding
                dispatchWalkthroughEvent('task_moved', { taskId: activeId, fromStatus: activeTask.status, toStatus: targetColumn });
            } catch (error) {
                console.error('Failed to update task position:', error);
                // Revert only the moved task — don't blow away other in-session changes
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === activeId ? { ...t, status: originalStatus, order: originalOrder } : t
                    )
                );
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
            } catch (error) {
                console.error('Failed to create task:', error);
                dispatchOptimistic({ type: 'DELETE', id: tempId });
            }
        });
    };

    const handleUpdateTask = async (taskId: string, data: Partial<TaskData>) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // If currently selected task is updated, update selected task state too
        if (selectedTask?.id === taskId) {
            setSelectedTask({ ...task, ...data });
        }

        startTransition(async () => {
            // Optimistic update
            const optimisticTask = { ...task, ...data };
            dispatchOptimistic({ type: 'UPDATE', task: optimisticTask });

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
                    dueDate: data.dueDate,
                    links: data.links,
                });
                // On success, sync with server state via setTasks
                setTasks((prev) => prev.map((t) => (t.id === taskId ? optimisticTask : t)));

                // Dispatch walkthrough events for interactive onboarding
                const previousAssignees = task.assignees.map(a => a.id);
                const newAssignees = data.assignees?.map((a) => a.id) || previousAssignees;
                const addedSelf = data.assignees?.some(a => a.id === currentUserId && !previousAssignees.includes(a.id));
                if (addedSelf && currentUserId) {
                    dispatchWalkthroughEvent('self_assigned', { taskId, userId: currentUserId });
                }

                if (data.description !== undefined && data.description !== task.description) {
                    dispatchWalkthroughEvent('description_updated', { taskId });
                }
            } catch (error) {
                console.error('Failed to update task:', error);
                // Revert optimistic update by dispatching original task
                dispatchOptimistic({ type: 'UPDATE', task });
                setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
            }
        });
    };

    const handleCommentsChange = useCallback((taskId: string, comments: TaskData['comments']) => {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, comments } : t)));
        setSelectedTask(prev => (prev && prev.id === taskId ? { ...prev, comments } : prev));
    }, []);

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

    const handleArchiveAllDone = async (taskIds: string[]) => {
        if (taskIds.length === 0) return;

        const tasksToArchive = tasks.filter((t) => taskIds.includes(t.id));

        startTransition(async () => {
            // Optimistic: remove archived tasks from view
            dispatchOptimistic({ type: 'DELETE', id: taskIds[0] });
            setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));

            try {
                await archiveTasks(taskIds);
            } catch (error) {
                console.error('Failed to archive tasks:', error);
                // Revert on error
                setTasks((prev) => [...prev, ...tasksToArchive]);
            }
        });
    };

    return (
        <div className="min-h-full p-3 md:p-4 overflow-x-auto md:overflow-x-hidden flex flex-col">
            {/* Enhanced Navigation Bar */}
            <div id="board-header" className="mb-4 flex items-center justify-between gap-2 md:gap-3 flex-wrap">
                {/* Left: Board Title & Color indicator */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Board Color Dot & Name */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full flex-shrink-0 ring-2 ring-[var(--background)]"
                            style={{ backgroundColor: boardColor }}
                        />
                        <h1 className="text-lg md:text-xl font-bold text-[var(--foreground)] tracking-tight truncate flex items-center gap-2">
                            <span>{boardName}</span>
                            {hasUnread}
                        </h1>
                    </div>
                </div>

                {/* Right: Primary Actions & Tools */}
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
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

                    {/* Plan with AI */}
                    {!isReadOnly && (
                        <button
                            onClick={openPlanWithAI}
                            disabled={planBusy}
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white text-xs md:text-sm font-semibold hover:shadow-md hover:shadow-[var(--brand-primary)]/25 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                            title={planBusy ? 'Planning in progress…' : 'Plan with AI'}
                        >
                            {planStream.state.phase === 'streaming' ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    <span>Planning…</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Plan with AI</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-[var(--border-subtle)] mx-1" />

                    {/* Quick Actions - Icon Buttons */}
                    <div className="flex items-center gap-0.5">
                        {/* Plan with AI — mobile entry (the labelled button is desktop-only,
                            so without this a non-empty board has no AI entry on mobile) */}
                        {!isReadOnly && (
                            <button
                                onClick={openPlanWithAI}
                                disabled={planBusy}
                                className="md:hidden p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={planBusy ? 'Planning in progress…' : 'Plan with AI'}
                                aria-label={planBusy ? 'Planning in progress' : 'Plan with AI'}
                            >
                                {planStream.state.phase === 'streaming' ? (
                                    <ArrowPathIcon className="w-4.5 h-4.5 animate-spin" />
                                ) : (
                                    <SparklesIcon className="w-4.5 h-4.5" />
                                )}
                            </button>
                        )}

                        {/* Settings */}
                        {!isReadOnly && (
                            <button
                                onClick={() => setIsEditingBoard(true)}
                                className="p-2.5 md:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
                                title="Board Settings"
                            >
                                <Cog6ToothIcon className="w-4.5 h-4.5" />
                            </button>
                        )}

                        {/* Comments */}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="p-2.5 md:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors relative"
                            title="Comments"
                        >
                            <ChatBubbleLeftRightIcon className="w-4.5 h-4.5" />
                        </button>

                        {/* Notifications */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 md:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors relative"
                            title="Notifications"
                            aria-label={boardUnreadCount > 0 ? `Notifications, ${boardUnreadCount} unread` : 'Notifications'}
                        >
                            <BellIcon className="w-4.5 h-4.5" />
                            {boardUnreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[var(--error-primary)] text-white text-[9px] font-bold leading-none ring-2 ring-[var(--surface)]">
                                    {boardUnreadCount > 99 ? '99+' : boardUnreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-2">
                {/* Left: Search */}
                <div className="relative w-full md:w-64">
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

                    {currentUserId && !isSoloBoard && (
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

                    {!isSoloBoard && (
                        <CustomSelect
                            value={filterMemberId}
                            onChange={setFilterMemberId}
                            options={[
                                { value: 'ALL', label: 'All Members' },
                                ...members.map(member => ({ value: member.id, label: member.name }))
                            ]}
                            minWidth="130px"
                        />
                    )}

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

            <PlanStreamBanner state={planStream.state} onCancel={planStream.cancel} onDismiss={planStream.reset} loadingMessages={streamLoadingMessages} />

            {optimisticTasks.length === 0 && !isReadOnly ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex items-center justify-center py-12"
                >
                    <div className="card p-8 max-w-md w-full text-center space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-[var(--brand-primary)]/20">
                            <SparklesIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-[var(--foreground)]">
                                Your board is empty
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Describe your project and let Flux plan it — or add tasks manually.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={planBusy ? undefined : { scale: 1.02 }}
                                whileTap={planBusy ? undefined : { scale: 0.98 }}
                                onClick={openPlanWithAI}
                                disabled={planBusy}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                {planStream.state.phase === 'streaming' ? (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                        Planning…
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Plan with AI
                                    </>
                                )}
                            </motion.button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Add a task manually
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetectionStrategy}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                // Only disable drag if search is active (priority/member filters allow drag)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                modifiers={searchQuery ? [] : undefined}
            >
                {/* Responsive columns container - horizontal scroll on mobile, grid on desktop */}
                <div className="flex gap-2 md:gap-3 w-full min-w-0 overflow-x-auto touch-pan-x pb-4 md:pb-0 md:overflow-visible snap-x snap-mandatory md:snap-none scroll-px-4 md:scroll-px-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
                    {columns.map((column) => (
                        <div key={column.id} className="flex flex-col flex-shrink-0 w-[85vw] max-w-[320px] md:w-[280px] md:flex-1 md:min-w-[160px] md:max-w-[320px] snap-center md:snap-start first:snap-none">
                            <Column
                                id={column.id}
                                title={column.title}
                                tasks={getTasksByColumn(column.id)}
                                isReadOnly={isReadOnly}
                                isDragDisabled={!!searchQuery}
                                isAdmin={isAdmin}
                                currentUserId={currentUserId}
                                onAddTask={() => setIsAddingTask(column.id)}
                                onUpdateTask={handleUpdateTask}
                                onDeleteTask={handleDeleteTask}
                                onArchiveAll={column.id === 'DONE' ? handleArchiveAllDone : undefined}
                                members={members}
                                readTaskIds={readTaskIds}
                                onTaskClick={(task) => {
                                    setSelectedTask(task);
                                    setReadTaskIds(prev => new Set([...prev, task.id]));
                                }}
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
            )}

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        isOpen={!!selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={handleUpdateTask}
                        onCommentsChange={handleCommentsChange}
                        onDelete={handleDeleteTask}
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

            <PlanWithAIModal
                // Re-mount when a pending prompt arrives so the modal seeds its
                // description from initialDescription (it only reads it on mount).
                key={pendingPlanPrompt ? 'plan-modal-seeded' : 'plan-modal'}
                isOpen={showPlanWithAI}
                onClose={() => { setShowPlanWithAI(false); setPendingPlanPrompt(null); }}
                boardId={boardId || ''}
                boardSlug={boardSlug || ''}
                boardName={boardName}
                workspaceSlug={workspaceSlug}
                initialDescription={pendingPlanPrompt ?? undefined}
                onStartBoardStream={handleStartBoardStream}
            />

            <PlanCompleteModal
                isOpen={showPlanComplete}
                cancelled={planStream.state.phase === 'cancelled'}
                tasksCreated={planStream.state.tasksCreated}
                columnTotals={planStream.state.columnTotals}
                error={undoError}
                onUndo={handleUndoAIPlan}
                onKeep={handleKeepPlan}
            />

            {isEditingBoard && (
                <EditBoardModal
                    workspaceSlug={workspaceSlug}
                    board={{
                        id: boardId || '',
                        name: boardName,
                        slug: boardSlug || '',
                        description: boardDescription,
                        color: boardColor,
                        categories: localCategories,
                    }}
                    userRole={userRole}
                    members={members}
                    currentUserId={currentUserId}
                    onClose={() => setIsEditingBoard(false)}
                    onCategoriesChange={(updatedCategories) => setLocalCategories(updatedCategories)}
                />
            )}

            {/* Comments Panel — every comment on this board, click-through to the task */}
            <CommentsPanel
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                workspaceSlug={workspaceSlug}
                boardSlug={boardSlug || ''}
                currentUserId={currentUserId}
                onOpenTask={handleOpenTaskById}
            />

            {/* Notifications Panel — board activity feed with mark-as-read */}
            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                workspaceSlug={workspaceSlug}
                boardSlug={boardSlug || ''}
                onOpenTask={handleOpenTaskById}
                onUnreadChange={refreshUnreadCount}
            />

            {/* Interactive Board Walkthrough for Onboarding */}
            {showWalkthrough && (
                <InteractiveBoardWalkthrough
                    workspaceSlug={workspaceSlug}
                    onComplete={async () => {
                        setShowWalkthrough(false);
                        await updateOnboardingProgress('completedTutorial');
                    }}
                    onSkip={() => {
                        setShowWalkthrough(false);
                    }}
                />
            )}

            {/* Contextual Tooltips for First Board Visit */}
            <BoardContextualTooltips />
        </div>
    );
}
