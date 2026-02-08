'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, UserPlus, AlignLeft, Tag, Clock, CheckSquare, Plus, Trash2, MessageSquare, Send } from 'lucide-react';
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
                            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={title}
                                        readOnly={isReadOnly}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSaveTitle}
                                        className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 placeholder-gray-400"
                                        placeholder="Task Title"
                                    />
                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                        <span className="px-2 py-0.5 rounded-md bg-gray-200/50 text-gray-600 font-medium text-xs">
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-200/50 transition-colors text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Main Content */}
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Description */}
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <AlignLeft className="w-4 h-4" />
                                                Description
                                            </div>
                                            <textarea
                                                value={description}
                                                readOnly={isReadOnly}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={handleSaveDescription}
                                                placeholder={isReadOnly ? "No description provided." : "Add a more detailed description..."}
                                                className="w-full min-h-[120px] text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all resize-y"
                                            />
                                        </div>

                                        {/* Subtasks */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <CheckSquare className="w-4 h-4" />
                                                    Subtasks
                                                </div>
                                                {totalSubtasks > 0 && (
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {progress}% Completed
                                                    </span>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            {totalSubtasks > 0 && (
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {(task.subtasks || []).map((subtask) => (
                                                    <div
                                                        key={subtask.id}
                                                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                                                    >
                                                        <button
                                                            disabled={isReadOnly}
                                                            onClick={() => handleToggleSubtask(subtask.id)}
                                                            className={`
                                                                flex-shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center
                                                                ${subtask.completed
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                    : 'bg-white border-gray-300 text-transparent hover:border-emerald-500'
                                                                }
                                                            `}
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span
                                                            className={`flex-1 text-sm transition-all ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                                                                }`}
                                                        >
                                                            {subtask.title}
                                                        </span>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Plus className="w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={newSubtaskTitle}
                                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddSubtask();
                                                            }}
                                                            placeholder="Add a subtask..."
                                                            className="flex-1 bg-transparent text-sm border-none focus:ring-0 p-0 placeholder-gray-400"
                                                        />
                                                        {newSubtaskTitle && (
                                                            <button
                                                                onClick={handleAddSubtask}
                                                                className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                                                            >
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity / Metadata */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                                <Clock className="w-4 h-4" />
                                                Activity
                                            </div>
                                            <div className="text-xs text-gray-500 pl-6 mb-6">
                                                Created on {new Date(task.createdAt).toLocaleString()}
                                            </div>

                                            {/* Comments Section */}
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                                                    <MessageSquare className="w-4 h-4" />
                                                    Comments
                                                </div>

                                                <div className="space-y-4 mb-4">
                                                    {(task.comments || []).map((comment) => (
                                                        <div key={comment.id} className="flex gap-3 group">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                                                {comment.user?.image ? (
                                                                    <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                                        {comment.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {comment.user?.name || 'Unknown User'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {new Date(comment.createdAt).toLocaleString()}
                                                                    </span>
                                                                    {(session?.user?.id === comment.userId || !isReadOnly) && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className="opacity-0 group-hover:opacity-100 ml-auto p-1 text-gray-400 hover:text-red-500 transition-opacity"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                                    {comment.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {!isReadOnly && (
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                                            {session?.user?.image ? (
                                                                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                                    {session?.user?.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <textarea
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleAddComment();
                                                                    }
                                                                }}
                                                                placeholder="Write a comment..."
                                                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[80px]"
                                                            />
                                                            <button
                                                                disabled={!newComment.trim() || isSubmittingComment}
                                                                onClick={handleAddComment}
                                                                className="absolute bottom-3 right-3 p-1.5 bg-[var(--brand-primary)] text-white rounded-md hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <Send className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                    {/* Sidebar */}
                                    <div className="space-y-6">
                                        {/* Priority */}
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                <Tag className="w-3 h-3" />
                                                Priority
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                                    <button
                                                        key={p}
                                                        disabled={isReadOnly}
                                                        onClick={() => onUpdate(task.id, { priority: p })}
                                                        className={`
                                                            flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all border
                                                            ${task.priority === p
                                                                ? priorityColors[p] + ' ring-1 ring-inset ring-black/5 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        {p.charAt(0) + p.slice(1).toLowerCase()}
                                                        {task.priority === p && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                <UserPlus className="w-3 h-3" />
                                                Assignees
                                            </div>
                                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                                {members.map((member) => {
                                                    const isAssigned = task.assignees.some((a) => a.id === member.id);
                                                    return (
                                                        <button
                                                            key={member.id}
                                                            disabled={isReadOnly}
                                                            onClick={() => handleToggleAssignee(member.id)}
                                                            className={`
                                                                w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors
                                                                ${isAssigned ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}
                                                            `}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden">
                                                                {member.image ? (
                                                                    <img src={member.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    member.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <span className="truncate flex-1 text-left">{member.name}</span>
                                                            {isAssigned && <Check className="w-3 h-3" />}
                                                        </button>
                                                    );
                                                })}
                                                {members.length === 0 && (
                                                    <p className="text-xs text-gray-400 italic">No members found</p>
                                                )}
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
