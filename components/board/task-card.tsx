'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars4Icon, EllipsisVerticalIcon, TrashIcon, PencilIcon, CheckIcon, CalendarIcon, UserPlusIcon, ArchiveBoxIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import type { TaskPriority } from '@/models/Task';

export interface Member {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export interface TaskData {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: TaskPriority;
    categoryId?: string | null;
    order: number;
    assignees: Member[];
    subtasks?: {
        id: string;
        title: string;
        completed: boolean;
        createdAt?: string;
        createdBy?: Member;
    }[];
    comments?: {
        id: string;
        content: string;
        userId: string;
        createdAt: string;
        user: Member;
        likes?: string[];
        reactions?: { emoji: string; userId: string }[];
        parentId?: string | null;
    }[];
    dueDate?: string;
    links?: { id: string; url: string; title: string }[];
    createdAt: string;
}

interface TaskCardProps {
    task: TaskData;
    isReadOnly?: boolean;
    isDragDisabled?: boolean;
    onUpdate?: (taskId: string, data: Partial<TaskData>) => void;
    onDelete?: (taskId: string) => void;
    members?: Member[];
    onClick?: (task: TaskData) => void;
    isOverlay?: boolean;
    categories?: { id: string; name: string; color: string }[];
    isRead?: boolean;
}

const priorityConfig = {
    HIGH: {
        border: 'border-red-400',
        ring: 'hover:ring-red-200 dark:hover:ring-red-900/50',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    MEDIUM: {
        border: 'border-amber-400',
        ring: 'hover:ring-amber-200 dark:hover:ring-amber-900/50',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    LOW: {
        border: 'border-blue-400',
        ring: 'hover:ring-blue-200 dark:hover:ring-blue-900/50',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
};

const priorityLabels = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

export function TaskCard({ task, isReadOnly = false, isDragDisabled = false, onUpdate, onDelete, members = [], onClick, isOverlay, categories = [], isRead = false }: TaskCardProps) {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const { data: session } = useSession();

    // Heuristic for unread comments: if there are comments, the last one is not by the current user, and the task hasn't been read yet
    const hasUnreadComments = task.comments && task.comments.length > 0 &&
        (!session?.user?.id || task.comments[task.comments.length - 1].userId !== session.user.id) && !isRead;

    const handleToggleAssignee = (memberId: string) => {
        const isAssigned = task.assignees.some(a => a.id === memberId);
        let newAssignees;
        if (isAssigned) {
            newAssignees = task.assignees.filter(a => a.id !== memberId);
        } else {
            const member = members.find(m => m.id === memberId);
            if (!member) return;
            newAssignees = [...task.assignees, member];
        }
        onUpdate?.(task.id, { assignees: newAssignees });
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.task-menu-container')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    useEffect(() => {
        setEditTitle(task.title);
    }, [task.title]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: isReadOnly || isMenuOpen || isEditing || isDragDisabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handlePriorityChange = (priority: TaskPriority) => {
        onUpdate?.(task.id, { priority });
    };

    const handleTitleSave = () => {
        if (editTitle.trim() !== task.title) {
            onUpdate?.(task.id, { title: editTitle });
        }
        setIsEditing(false);
    };

    const config = priorityConfig[task.priority];
    const subtaskCount = task.subtasks?.length || 0;
    const completedSubtaskCount = task.subtasks?.filter(s => s.completed).length || 0;
    const subtaskProgress = subtaskCount > 0 ? (completedSubtaskCount / subtaskCount) * 100 : 0;
    const isDone = task.status === 'DONE';

    return (
        <motion.div
            layout={!isDragging}
            ref={setNodeRef}
            style={style}
            initial={isOverlay ? false : { opacity: 0, scale: 0.9, y: 20 }}
            animate={isOverlay ? false : { opacity: 1, scale: 1, y: 0 }}
            exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.2 }
            }}
            onClick={(e) => {
                // Only trigger if not editing and not menu open
                if (!isEditing && !isMenuOpen) {
                    onClick?.(task);
                }
            }}
            {...attributes}
            className={`
                relative group bg-[var(--surface)] rounded-lg
                border ${config.border}
                ${isDragging
                    ? 'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] ring-2 ring-[var(--brand-primary)]/30 rotate-1 scale-[1.02] opacity-95 z-50 cursor-grabbing'
                    : isMenuOpen
                        ? 'shadow-md z-40'
                        : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] transition-all duration-200'
                }
                ${isDone ? 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0' : ''}
                p-3.5 flex flex-col gap-2 origin-center outline-none
                ${isDragging ? 'transition-transform duration-150' : ''}
            `}
        >
            {/* Comments Icon (Hovering) */}
            {task.comments && task.comments.length > 0 && !isEditing && (
                <div className={`absolute -top-1 -right-1 z-30 ${hasUnreadComments ? 'bg-[var(--error-primary)]' : 'bg-[var(--text-tertiary)]'} text-[var(--text-inverse)] px-1 py-0.5 text-[9px] font-bold rounded-bl rounded-tr shadow-md flex items-center justify-center`}>
                    <ChatBubbleLeftIcon className="w-2.5 h-2.5" />
                </div>
            )}
            {/* Drag Handle */}
            {!isReadOnly && !isEditing && (
                <div
                    {...listeners}
                    {...attributes}
                    className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Drag to reorder"
                >
                    <Bars4Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
            )}
            {/* Action Menu Button */}
            {!isReadOnly && !isEditing && (
                <div className="absolute top-1.5 right-1.5 z-20 task-menu-container">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`p-1 rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1 ${isMenuOpen
                            ? 'bg-[var(--background-subtle)] text-[var(--text-primary)] opacity-100'
                            : 'text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--background-subtle)] hover:text-[var(--text-primary)] focus-visible:opacity-100'
                            }`}
                        aria-label="Task options"
                    >
                        <EllipsisVerticalIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border-subtle)] p-2 z-50 overflow-hidden"
                            >
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-subtle)] rounded-lg transition-colors font-medium"
                                    >
                                        <PencilIcon className="w-4 h-4 text-slate-400" />
                                        Edit Task
                                    </button>

                                    {/* Priority Section */}
                                    <div className="px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-2">Priority</p>
                                        <div className="flex gap-2">
                                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => handlePriorityChange(p)}
                                                    className={`
                                                        flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all
                                                        ${task.priority === p
                                                            ? priorityConfig[p].badge + ' ring-2 ring-inset ring-black/5 shadow-sm scale-105'
                                                            : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] bg-[var(--background-subtle)] border border-[var(--border-subtle)]'
                                                        }
                                                    `}
                                                    title={priorityLabels[p]}
                                                >
                                                    {p.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-[var(--border-subtle)] my-1" />

                                    {/* Assignees Section */}
                                    <div className="px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-2 flex items-center gap-2">
                                            <UserPlusIcon className="w-3 h-3" />
                                            Assignees
                                        </p>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {members.length > 0 ? members.map((member) => {
                                                const isAssigned = task.assignees.some(a => a.id === member.id);
                                                return (
                                                    <button
                                                        key={member.id}
                                                        onClick={() => handleToggleAssignee(member.id)}
                                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${isAssigned ? 'bg-[var(--flux-info-bg)] text-[var(--flux-info-text-strong)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-[var(--background-subtle)] flex items-center justify-center text-[9px] font-bold overflow-hidden">
                                                                {member.image ? (
                                                                    <img
                                                                        src={member.image}
                                                                        alt={member.name}
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    member.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <span>{member.name}</span>
                                                        </div>
                                                        {isAssigned && <CheckIcon className="w-3 h-3" />}
                                                    </button>
                                                );
                                            }) : (
                                                <div className="text-xs text-[var(--text-tertiary)] italic text-center py-2">
                                                    No members found
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-[var(--border-subtle)] my-1" />

                                    <button
                                        onClick={() => {
                                            onUpdate?.(task.id, { status: 'ARCHIVED' });
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-subtle)] rounded-lg transition-colors font-medium"
                                    >
                                        <ArchiveBoxIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        Archive Task
                                    </button>

                                    <button
                                        onClick={() => onDelete?.(task.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--flux-error-primary)] hover:bg-[var(--flux-error-bg)] rounded-lg transition-colors font-medium"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Content Container */}
            <div className="flex flex-col gap-2">
                {/* Category Badge - Moved to Top */}
                {!isEditing && task.categoryId && categories && (
                    (() => {
                        const cat = categories.find(c => c.id === task.categoryId);
                        if (!cat) return null;
                        return (
                            <div className="flex mb-1">
                                <div
                                    style={{
                                        color: cat.color,
                                        borderColor: cat.color
                                    }}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[var(--surface)] dark:border-[var(--border-subtle)]"
                                >
                                    {cat.name}
                                </div>
                            </div>
                        );
                    })()
                )}

                {/* Title */}
                {isEditing ? (
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <textarea
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleTitleSave();
                                }
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            onBlur={handleTitleSave}
                            className="w-full text-sm border-2 border-[var(--brand-primary)] rounded-lg p-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10 min-h-[80px] resize-none font-medium leading-relaxed bg-[var(--background-subtle)] text-[var(--text-primary)]"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleTitleSave()}
                                className="text-xs bg-[var(--brand-primary)] text-white px-3 py-1.5 rounded-md font-medium hover:bg-[var(--brand-primary-hover)] transition-colors shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <h3
                        className="font-semibold text-sm text-[var(--text-primary)] break-words leading-tight pr-5"
                        style={{ wordBreak: 'break-word' }}
                    >
                        {task.title}
                    </h3>
                )}

                {/* Description */}
                {task.description && !isEditing && (
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2 break-words">
                        {task.description}
                    </p>
                )}

                {/* Subtasks Progress Bar */}
                {subtaskCount > 0 && !isEditing && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-[var(--text-secondary)]">
                                {completedSubtaskCount}/{subtaskCount} subtasks
                            </span>
                            <span className="text-[9px] font-bold text-[var(--brand-primary)]">
                                {Math.round(subtaskProgress)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--background-subtle)] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subtaskProgress}%` }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={`h-full rounded-full ${subtaskProgress === 100 ? 'bg-green-500' : 'bg-[var(--brand-primary)]'}`}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                {/* Top row: Assignees + Priority */}
                <div className="flex items-center justify-between gap-2">
                    {/* Assignees */}
                    <div className="flex flex-wrap gap-1.5">
                        {task.assignees.length > 0 ? (
                            task.assignees.slice(0, 2).map((assignee) => (
                                <div
                                    key={assignee.id}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--background-subtle)] text-[10px] font-bold text-[var(--text-secondary)]"
                                >
                                    <div className="w-3 h-3 rounded-full bg-[var(--background-subtle)] overflow-hidden flex-shrink-0">
                                        {assignee.image ? (
                                            <img
                                                src={assignee.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[var(--flux-info-bg)] text-[var(--flux-info-text-strong)] font-bold text-[7px]">
                                                {assignee.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="truncate max-w-[35px]">{assignee.name.split(' ')[0]}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-[9px] text-[var(--text-tertiary)] italic">Unassigned</div>
                        )}
                        {task.assignees.length > 2 && (
                            <div className="px-1 py-0.5 rounded-full bg-[var(--background-subtle)] text-[9px] font-semibold text-[var(--text-secondary)]">
                                +{task.assignees.length - 2}
                            </div>
                        )}
                    </div>

                    {/* Priority Badge */}
                    <div className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${config.badge}`}>
                        {priorityLabels[task.priority]}
                    </div>
                </div>

                {/* Bottom row: Due Date & Links */}
                <div className="flex items-center gap-2">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'ARCHIVED'
                                ? 'bg-[var(--error-bg)] text-[var(--error-text-strong)]'
                                : 'bg-[var(--background-subtle)] text-[var(--text-secondary)]'
                        }`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                    {task.links && task.links.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {task.links.length}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
