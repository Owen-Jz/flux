'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, UserPlus, AlignLeft, Tag, Clock, CheckSquare, Plus, Trash2, MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { TaskData, Member } from './task-card';
import { addComment, deleteComment } from '@/actions/task';
import { useSession } from 'next-auth/react';

interface TaskDetailModalProps {
    task: TaskData;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (taskId: string, data: Partial<TaskData>) => void;
    members?: Member[];
    isReadOnly?: boolean;
    categories?: { id: string; name: string; color: string }[];
}

const priorityColors = {
    HIGH: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    MEDIUM: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    LOW: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export function TaskDetailModal({
    task,
    isOpen,
    onClose,
    onUpdate,
    members = [],
    isReadOnly = false,
    categories = [],
}: TaskDetailModalProps) {
    const { data: session } = useSession();
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
    }, [task]);

    const handleSaveTitle = () => {
        if (title.trim() !== task.title) {
            onUpdate(task.id, { title });
        }
    };

    const handleSaveDescription = () => {
        if (description.trim() !== (task.description || '')) {
            onUpdate(task.id, { description });
        }
    };

    const handleToggleAssignee = (memberId: string) => {
        const isAssigned = task.assignees.some((a) => a.id === memberId);
        let newAssignees;
        if (isAssigned) {
            newAssignees = task.assignees.filter((a) => a.id !== memberId);
        } else {
            const member = members.find((m) => m.id === memberId);
            if (!member) return;
            newAssignees = [...task.assignees, member];
        }
        onUpdate(task.id, { assignees: newAssignees });
    };

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSubtask = {
            id: `temp-${Date.now()}`,
            title: newSubtaskTitle,
            completed: false
        };
        const updatedSubtasks = [...(task.subtasks || []), newSubtask];
        onUpdate(task.id, { subtasks: updatedSubtasks });
        setNewSubtaskTitle('');
    };

    const handleToggleSubtask = (subtaskId: string) => {
        const updatedSubtasks = (task.subtasks || []).map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        onUpdate(task.id, { subtasks: updatedSubtasks });
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        const updatedSubtasks = (task.subtasks || []).filter(s => s.id !== subtaskId);
        onUpdate(task.id, { subtasks: updatedSubtasks });
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        setError(null);
        try {
            const comment = await addComment(task.id, newComment);
            onUpdate(task.id, {
                comments: [...(task.comments || []), comment]
            });
            setNewComment('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        setError(null);
        try {
            await deleteComment(task.id, commentId);
            onUpdate(task.id, {
                comments: (task.comments || []).filter(c => c.id !== commentId)
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete comment');
        }
    };

    const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
    const totalSubtasks = (task.subtasks || []).length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)]"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between p-8 border-b border-[var(--border-subtle)] bg-[var(--surface)]">
                                {error && (
                                    <div className="w-full mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2.5 py-1 rounded-md bg-[var(--background-subtle)] text-[var(--text-secondary)] font-bold text-[10px] tracking-wider uppercase border border-[var(--border-subtle)]">
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        readOnly={isReadOnly}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSaveTitle}
                                        className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                        placeholder="Task Title"
                                    />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-[var(--background-subtle)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-[var(--background)]">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                    {/* Main Content */}
                                    <div className="md:col-span-8 space-y-10">
                                        {/* Description */}
                                        <div className="group">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                                <AlignLeft className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                Description
                                            </div>
                                            <textarea
                                                value={description}
                                                readOnly={isReadOnly}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={handleSaveDescription}
                                                placeholder={isReadOnly ? "No description provided." : "Add a more detailed description..."}
                                                className="w-full min-h-[160px] text-[15px] text-[var(--text-primary)] leading-relaxed bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-4 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none shadow-sm"
                                            />
                                        </div>

                                        {/* Subtasks */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)]">
                                                    <CheckSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                    Subtasks
                                                </div>
                                                {totalSubtasks > 0 && (
                                                    <span className="text-xs font-bold text-[var(--brand-primary)]">
                                                        {progress}% Complete
                                                    </span>
                                                )}
                                            </div>

                                            {totalSubtasks > 0 && (
                                                <div className="h-2 w-full bg-[var(--background-subtle)] rounded-full overflow-hidden mb-5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-[var(--brand-primary)]"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                {(task.subtasks || []).map((subtask) => (
                                                    <div
                                                        key={subtask.id}
                                                        className="group flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)] hover:shadow-sm border border-transparent hover:border-[var(--border-subtle)] transition-all"
                                                    >
                                                        <button
                                                            disabled={isReadOnly}
                                                            onClick={() => handleToggleSubtask(subtask.id)}
                                                            className={`
                                                                flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                                                                ${subtask.completed
                                                                    ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20'
                                                                    : 'bg-[var(--surface)] border-[var(--border-default)] text-transparent hover:border-[var(--brand-primary)]'
                                                                }
                                                            `}
                                                        >
                                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        </button>
                                                        <span
                                                            className={`flex-1 text-[14px] font-medium transition-all ${subtask.completed ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'
                                                                }`}
                                                        >
                                                            {subtask.title}
                                                        </span>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-tertiary)] hover:text-[var(--flux-error-primary)] hover:bg-[var(--flux-error-bg)] rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-3 p-2 group/input relative">
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            <Plus className="w-4 h-4 text-[var(--text-tertiary)] group-hover/input:text-[var(--brand-primary)] transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={newSubtaskTitle}
                                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddSubtask();
                                                            }}
                                                            placeholder="Add a subtask..."
                                                            className="flex-1 bg-transparent text-[14px] border-none focus:ring-0 p-0 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-medium"
                                                        />
                                                        {newSubtaskTitle.trim() && (
                                                            <button
                                                                onClick={handleAddSubtask}
                                                                className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--brand-primary-hover)] transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                                                            >
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity */}
                                        <div className="pt-8 border-t border-[var(--border-subtle)]">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)] mb-6">
                                                <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                Activity
                                            </div>

                                            <div className="pl-6 border-l-2 border-[var(--border-subtle)] ml-2 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--background-subtle)] border-2 border-[var(--surface)]" />
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                        Created on {new Date(task.createdAt).toLocaleString(undefined, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                </div>

                                                {/* Comments */}
                                                <div className="space-y-6">
                                                    {(task.comments || []).map((comment) => (
                                                        <div key={comment.id} className="flex gap-4 group/comment relative">
                                                            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] border-2 border-white dark:border-neutral-800" />
                                                            <div className="w-9 h-9 rounded-full bg-[var(--flux-info-bg)] border border-[var(--flux-info-border)] flex-shrink-0 overflow-hidden shadow-sm">
                                                                {comment.user?.image ? (
                                                                    <img
                                                                        src={comment.user.image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[var(--flux-info-text-strong)] uppercase">
                                                                        {comment.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1.5 min-h-[1.25rem]">
                                                                    <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                                                        {comment.user?.name || 'Unknown User'}
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">
                                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    {(session?.user?.id === comment.userId || !isReadOnly) && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className="opacity-0 group-hover/comment:opacity-100 ml-auto p-1.5 text-[var(--text-tertiary)] hover:text-[var(--flux-error-primary)] transition-all"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-[14px] text-[var(--text-primary)] bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm leading-relaxed">
                                                                    {comment.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {!isReadOnly && (
                                                        <div className="flex gap-4 pt-2">
                                                            <div className="w-10 h-10 rounded-full bg-[var(--background-subtle)] border border-[var(--border-subtle)] flex-shrink-0 overflow-hidden shadow-sm">
                                                                {session?.user?.image ? (
                                                                    <img
                                                                        src={session.user.image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] uppercase">
                                                                        {session?.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 relative">
                                                                <textarea
                                                                    value={newComment}
                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                    placeholder="Write a comment..."
                                                                    className="w-full text-[14px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 pr-12 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[100px] shadow-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                                                />
                                                                <button
                                                                    disabled={!newComment.trim() || isSubmittingComment}
                                                                    onClick={handleAddComment}
                                                                    className="absolute bottom-3 right-3 p-2 bg-[var(--brand-primary)] text-white rounded-xl hover:shadow-lg hover:shadow-[var(--brand-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    {isSubmittingComment ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <Send className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="md:col-span-4 space-y-10">
                                        {/* Categories */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <Tag className="w-3.5 h-3.5" />
                                                Category
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    disabled={isReadOnly}
                                                    onClick={() => onUpdate(task.id, { categoryId: null })}
                                                    className={`
                                                        px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all
                                                        ${!task.categoryId
                                                            ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)] shadow-lg'
                                                            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                                        }
                                                    `}
                                                >
                                                    None
                                                </button>
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        disabled={isReadOnly}
                                                        onClick={() => onUpdate(task.id, { categoryId: cat.id })}
                                                        className={`
                                                            px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all flex items-center gap-2
                                                            ${task.categoryId === cat.id
                                                                ? 'shadow-lg ring-2 ring-offset-2 tracking-tight'
                                                                : 'bg-[var(--surface)] opacity-60 hover:opacity-100 border-[var(--border-subtle)] shadow-sm'
                                                            }
                                                        `}
                                                        style={{
                                                            background: task.categoryId === cat.id ? cat.color : undefined,
                                                            borderColor: task.categoryId === cat.id ? cat.color : undefined,
                                                            color: task.categoryId === cat.id ? '#fff' : 'inherit',
                                                            ['--tw-ring-color' as any]: cat.color + '40',
                                                            ['--tw-ring-offset-color' as any]: '#fff',
                                                        }}
                                                    >
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${task.categoryId === cat.id ? 'bg-white' : ''}`}
                                                            style={{ backgroundColor: task.categoryId === cat.id ? undefined : cat.color }}
                                                        />
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <AlignLeft className="w-3.5 h-3.5 rotate-90" />
                                                Priority
                                            </div>
                                            <div className="space-y-2">
                                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                                    <button
                                                        key={p}
                                                        disabled={isReadOnly}
                                                        onClick={() => onUpdate(task.id, { priority: p })}
                                                        className={`
                                                            w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all border
                                                            ${task.priority === p
                                                                ? priorityColors[p] + ' border-transparent shadow-lg'
                                                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                                            }
                                                        `}
                                                    >
                                                        {p.charAt(0) + p.slice(1).toLowerCase()}
                                                        {task.priority === p && <Check className="w-4 h-4 stroke-[3]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Assignees
                                            </div>
                                            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
                                                <div className="divide-y divide-[var(--border-subtle)] max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {members.map((member) => {
                                                        const isAssigned = task.assignees.some((a) => a.id === member.id);
                                                        return (
                                                            <button
                                                                key={member.id}
                                                                disabled={isReadOnly}
                                                                onClick={() => handleToggleAssignee(member.id)}
                                                                className={`
                                                                    w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left
                                                                    ${isAssigned ? 'bg-[var(--flux-info-bg)]' : 'hover:bg-[var(--background-subtle)]'}
                                                                `}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-[var(--background-subtle)] flex-shrink-0 overflow-hidden shadow-sm border border-[var(--surface)]">
                                                                    {member.image ? (
                                                                        <img
                                                                            src={member.image}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--text-secondary)] uppercase">
                                                                            {member.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-[13px] font-semibold truncate ${isAssigned ? 'text-[var(--flux-info-text-strong)]' : 'text-[var(--text-primary)]'}`}>
                                                                        {member.name}
                                                                    </p>
                                                                </div>
                                                                <div className={`
                                                                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                                    ${isAssigned
                                                                        ? 'bg-[var(--flux-info-primary)] border-[var(--flux-info-primary)] text-white'
                                                                        : 'border-[var(--border-subtle)] bg-[var(--surface)] group-hover:border-[var(--border-default)]'
                                                                    }
                                                                `}>
                                                                    {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                    {members.length === 0 && (
                                                        <div className="px-4 py-8 text-center">
                                                            <p className="text-xs text-[var(--text-tertiary)] font-medium italic">No members available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
