'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, MoreHorizontal, Trash2, Pencil, Check, Calendar, UserPlus, Archive } from 'lucide-react';
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
    order: number;
    assignees: Member[];
    subtasks?: {
        id: string;
        title: string;
        completed: boolean;
    }[];
    comments?: {
        id: string;
        content: string;
        userId: string;
        createdAt: string;
        user: Member;
    }[];
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
}

const priorityConfig = {
    HIGH: {
        border: 'border-red-400',
        ring: 'hover:ring-red-200',
        badge: 'bg-red-100 text-red-700',
    },
    MEDIUM: {
        border: 'border-amber-400',
        ring: 'hover:ring-amber-200',
        badge: 'bg-amber-100 text-amber-700',
    },
    LOW: {
        border: 'border-blue-400',
        ring: 'hover:ring-blue-200',
        badge: 'bg-blue-100 text-blue-700',
    },
};

const priorityLabels = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

export function TaskCard({ task, isReadOnly = false, isDragDisabled = false, onUpdate, onDelete, members = [], onClick }: TaskCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

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
    const isDone = task.status === 'DONE';

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => {
                // Only trigger if not editing and not menu open
                if (!isEditing && !isMenuOpen) {
                    onClick?.(task);
                }
            }}
            {...attributes}
            {...listeners}
            className={`
                relative group cursor-pointer bg-white rounded-xl
                border ${config.border}
                ${isDragging
                    ? 'shadow-2xl rotate-2 opacity-90 z-50 scale-105'
                    : isMenuOpen
                        ? 'shadow-md z-40'
                        : 'shadow-sm hover:shadow-md transition-all duration-200'
                }
                ${isDone ? 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0' : ''}
                p-4 flex flex-col gap-2
            `}
        >
            {/* Action Menu Button */}
            {!isReadOnly && !isEditing && (
                <div className="absolute top-2 right-2 z-20 task-menu-container">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${isMenuOpen
                            ? 'bg-gray-100 text-gray-900 opacity-100'
                            : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                            >
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-400" />
                                        Edit Task
                                    </button>

                                    {/* Priority Section */}
                                    <div className="px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Priority</p>
                                        <div className="flex gap-2">
                                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => handlePriorityChange(p)}
                                                    className={`
                                                        flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all
                                                        ${task.priority === p
                                                            ? priorityConfig[p].badge + ' ring-2 ring-inset ring-black/5 shadow-sm scale-105'
                                                            : 'text-gray-500 hover:bg-gray-50 bg-gray-50 border border-gray-100'
                                                        }
                                                    `}
                                                    title={priorityLabels[p]}
                                                >
                                                    {p.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 my-1" />

                                    {/* Assignees Section */}
                                    <div className="px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2 flex items-center gap-2">
                                            <UserPlus className="w-3 h-3" />
                                            Assignees
                                        </p>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {members.length > 0 ? members.map((member) => {
                                                const isAssigned = task.assignees.some(a => a.id === member.id);
                                                return (
                                                    <button
                                                        key={member.id}
                                                        onClick={() => handleToggleAssignee(member.id)}
                                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${isAssigned ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                                                                {member.image ? (
                                                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    member.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <span>{member.name}</span>
                                                        </div>
                                                        {isAssigned && <Check className="w-3 h-3" />}
                                                    </button>
                                                );
                                            }) : (
                                                <div className="text-xs text-gray-400 italic text-center py-2">
                                                    No members found
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 my-1" />

                                    <button
                                        onClick={() => {
                                            onUpdate?.(task.id, { status: 'ARCHIVED' });
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                    >
                                        <Archive className="w-4 h-4 text-gray-400" />
                                        Archive Task
                                    </button>

                                    <button
                                        onClick={() => onDelete?.(task.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
                            className="w-full text-sm border-2 border-[var(--brand-primary)] rounded-lg p-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10 min-h-[80px] resize-none font-medium leading-relaxed bg-gray-50"
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
                        className="font-bold text-[15px] text-gray-900 break-words leading-tight tracking-tight pr-6"
                        style={{ wordBreak: 'break-word' }}
                    >
                        {task.title}
                    </h3>
                )}

                {/* Description */}
                {task.description && !isEditing && (
                    <p className="text-[12px] text-gray-500 leading-snug line-clamp-2 font-medium">
                        {task.description}
                    </p>
                )}

                {/* Subtasks Badge */}
                {subtaskCount > 0 && !isEditing && (
                    <div className="flex">
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-md">
                            +{subtaskCount} subtasks
                        </span>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2">
                {/* Assignees */}
                <div className="flex flex-wrap gap-2">
                    {task.assignees.length > 0 ? (
                        task.assignees.slice(0, 2).map((assignee) => (
                            <div
                                key={assignee.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600"
                            >
                                <div className="w-3.5 h-3.5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    {assignee.image ? (
                                        <img src={assignee.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-[8px]">
                                            {assignee.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="truncate max-w-[50px]">{assignee.name.split(' ')[0]}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-[10px] text-gray-400 italic">Unassigned</div>
                    )}
                    {task.assignees.length > 2 && (
                        <div className="px-1.5 py-1 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                            +{task.assignees.length - 2}
                        </div>
                    )}
                </div>

                {/* Priority Badge */}
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${config.badge}`}>
                    {priorityLabels[task.priority]}
                </div>
            </div>
        </motion.div>
    );
}
