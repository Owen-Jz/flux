'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, UserPlus, AlignLeft, Tag, Clock, CheckSquare, Plus, Trash2, MessageSquare, Send, Loader2 } from 'lucide-react';
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
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
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
        try {
            const comment = await addComment(task.id, newComment);
            onUpdate(task.id, {
                comments: [...(task.comments || []), comment]
            });
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await deleteComment(task.id, commentId);
            onUpdate(task.id, {
                comments: (task.comments || []).filter(c => c.id !== commentId)
            });
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('Failed to delete comment');
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
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between p-8 border-b border-gray-100 bg-white">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] tracking-wider uppercase border border-slate-200">
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        readOnly={isReadOnly}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSaveTitle}
                                        className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 placeholder-gray-300"
                                        placeholder="Task Title"
                                    />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd]">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                    {/* Main Content */}
                                    <div className="md:col-span-8 space-y-10">
                                        {/* Description */}
                                        <div className="group">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 mb-3">
                                                <AlignLeft className="w-4 h-4 text-gray-400" />
                                                Description
                                            </div>
                                            <textarea
                                                value={description}
                                                readOnly={isReadOnly}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={handleSaveDescription}
                                                placeholder={isReadOnly ? "No description provided." : "Add a more detailed description..."}
                                                className="w-full min-h-[160px] text-[15px] text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none shadow-sm"
                                            />
                                        </div>

                                        {/* Subtasks */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900">
                                                    <CheckSquare className="w-4 h-4 text-gray-400" />
                                                    Subtasks
                                                </div>
                                                {totalSubtasks > 0 && (
                                                    <span className="text-xs font-bold text-[var(--brand-primary)]">
                                                        {progress}% Complete
                                                    </span>
                                                )}
                                            </div>

                                            {totalSubtasks > 0 && (
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
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
                                                        className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
                                                    >
                                                        <button
                                                            disabled={isReadOnly}
                                                            onClick={() => handleToggleSubtask(subtask.id)}
                                                            className={`
                                                                flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                                                                ${subtask.completed
                                                                    ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20'
                                                                    : 'bg-white border-gray-200 text-transparent hover:border-[var(--brand-primary)]'
                                                                }
                                                            `}
                                                        >
                                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        </button>
                                                        <span
                                                            className={`flex-1 text-[14px] font-medium transition-all ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                                                                }`}
                                                        >
                                                            {subtask.title}
                                                        </span>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-3 p-2 group/input relative">
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            <Plus className="w-4 h-4 text-gray-300 group-hover/input:text-[var(--brand-primary)] transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={newSubtaskTitle}
                                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddSubtask();
                                                            }}
                                                            placeholder="Add a subtask..."
                                                            className="flex-1 bg-transparent text-[14px] border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-400 font-medium"
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
                                        <div className="pt-8 border-t border-gray-100">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 mb-6">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                Activity
                                            </div>

                                            <div className="pl-6 border-l-2 border-gray-50 ml-2 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-200 border-2 border-white" />
                                                    <p className="text-xs text-gray-500 font-medium">
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
                                                            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] border-2 border-white" />
                                                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex-shrink-0 overflow-hidden shadow-sm">
                                                                {comment.user?.image ? (
                                                                    <img
                                                                        src={comment.user.image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-indigo-500 uppercase">
                                                                        {comment.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1.5 min-h-[1.25rem]">
                                                                    <span className="text-[13px] font-semibold text-gray-900 truncate">
                                                                        {comment.user?.name || 'Unknown User'}
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    {(session?.user?.id === comment.userId || !isReadOnly) && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className="opacity-0 group-hover/comment:opacity-100 ml-auto p-1.5 text-gray-400 hover:text-red-500 transition-all"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-[14px] text-gray-700 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm leading-relaxed">
                                                                    {comment.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {!isReadOnly && (
                                                        <div className="flex gap-4 pt-2">
                                                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden shadow-sm">
                                                                {session?.user?.image ? (
                                                                    <img
                                                                        src={session.user.image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                                                                        {session?.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 relative">
                                                                <textarea
                                                                    value={newComment}
                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                    placeholder="Write a comment..."
                                                                    className="w-full text-[14px] bg-white border border-gray-100 rounded-2xl p-4 pr-12 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[100px] shadow-sm font-medium"
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
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
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
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                                                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
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
                                                                : 'bg-white opacity-60 hover:opacity-100 border-gray-100 shadow-sm'
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
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
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
                                                                ? priorityColors[p] + ' border-transparent shadow-lg shadow-indigo-500/5'
                                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
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
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Assignees
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {members.map((member) => {
                                                        const isAssigned = task.assignees.some((a) => a.id === member.id);
                                                        return (
                                                            <button
                                                                key={member.id}
                                                                disabled={isReadOnly}
                                                                onClick={() => handleToggleAssignee(member.id)}
                                                                className={`
                                                                    w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left
                                                                    ${isAssigned ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}
                                                                `}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden shadow-sm border border-white">
                                                                    {member.image ? (
                                                                        <img
                                                                            src={member.image}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                                            {member.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-[13px] font-semibold truncate ${isAssigned ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                                        {member.name}
                                                                    </p>
                                                                </div>
                                                                <div className={`
                                                                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                                    ${isAssigned
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-slate-100 bg-white group-hover:border-slate-300'
                                                                    }
                                                                `}>
                                                                    {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                    {members.length === 0 && (
                                                        <div className="px-4 py-8 text-center">
                                                            <p className="text-xs text-gray-400 font-medium italic">No members available</p>
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
