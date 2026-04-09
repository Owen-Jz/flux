'use client';
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CalendarIcon, CheckIcon, UserPlusIcon, Bars3BottomLeftIcon, TagIcon, ClockIcon, Squares2X2Icon, PlusIcon, TrashIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon, ExclamationCircleIcon, HeartIcon, ArrowUturnLeftIcon, FaceSmileIcon, LinkIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { TaskData, Member } from './task-card';
import { addComment, deleteComment, likeComment, replyToComment, addReaction, getWorkspaceMembers } from '@/actions/task';
import CustomSelect from '../ui/custom-select';
import { useSession } from 'next-auth/react';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🙏', '👀'];

const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'DONE', label: 'Done' },
];

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
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [workspaceMembers, setWorkspaceMembers] = useState<Member[]>([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [showSubtaskDetails, setShowSubtaskDetails] = useState(false);
    const [commentChips, setCommentChips] = useState<{ type: 'subtask' | 'user'; id: string; title: string; completed?: boolean }[]>([]);
    const [replyChips, setReplyChips] = useState<{ type: 'subtask' | 'user'; id: string; title: string; completed?: boolean }[]>([]);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
    }, [task]);

    // Load workspace members for @mentions
    useEffect(() => {
        async function loadMembers() {
            if (members && members.length > 0) {
                setWorkspaceMembers(members);
            }
        }
        loadMembers();
    }, [members]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (showEmojiPicker) {
                setShowEmojiPicker(null);
            }
            if (showMentionDropdown) {
                setShowMentionDropdown(false);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showEmojiPicker, showMentionDropdown]);

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

    const handleAddLink = () => {
        if (!newLinkUrl.trim()) return;
        const newLink = {
            id: `temp-${Date.now()}`,
            url: newLinkUrl,
            title: newLinkTitle || newLinkUrl,
        };
        const updatedLinks = [...(task.links || []), newLink];
        onUpdate(task.id, { links: updatedLinks });
        setNewLinkUrl('');
        setNewLinkTitle('');
    };

    const handleDeleteLink = (linkId: string) => {
        const updatedLinks = (task.links || []).filter(l => l.id !== linkId);
        onUpdate(task.id, { links: updatedLinks });
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        setError(null);
        try {
            const content = buildCommentContent(newComment, commentChips);
            const comment = await addComment(task.id, content);
            onUpdate(task.id, {
                comments: [...(task.comments || []), comment]
            });
            setNewComment('');
            setCommentChips([]);
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

    const handleLikeComment = async (commentId: string) => {
        if (likingCommentId) return;

        setLikingCommentId(commentId);
        setError(null);
        try {
            const result = await likeComment(task.id, commentId);
            // Update local state optimistically
            const updatedComments = (task.comments || []).map(c => {
                if (c.id === commentId) {
                    const currentLikes = c.likes || [];
                    const userId = session?.user?.id;
                    if (userId) {
                        const isLiked = currentLikes.includes(userId);
                        return {
                            ...c,
                            likes: isLiked
                                ? currentLikes.filter((id: string) => id !== userId)
                                : [...currentLikes, userId]
                        };
                    }
                }
                return c;
            });
            onUpdate(task.id, { comments: updatedComments });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to like comment');
        } finally {
            setLikingCommentId(null);
        }
    };

    const handleReplySubmit = async (parentCommentId: string) => {
        if (!replyContent.trim() || isSubmittingReply) return;

        setIsSubmittingReply(true);
        setError(null);
        try {
            const content = buildCommentContent(replyContent, replyChips);
            const reply = await replyToComment(task.id, parentCommentId, content);
            if (reply && 'id' in reply) {
                onUpdate(task.id, {
                    comments: [...(task.comments || []), reply]
                });
            }
            setReplyContent('');
            setReplyChips([]);
            setReplyingTo(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleAddReaction = async (commentId: string, emoji: string) => {
        setError(null);
        try {
            const result = await addReaction(task.id, commentId, emoji);
            // Update local state with new reactions
            const updatedComments = (task.comments || []).map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        reactions: result.reactions as { emoji: string; userId: string }[]
                    };
                }
                return c;
            });
            onUpdate(task.id, { comments: updatedComments });
            setShowEmojiPicker(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add reaction');
        }
    };

    // Filter members and subtasks for mention dropdown
    const filteredMembers = workspaceMembers.filter(m =>
        m.name?.toLowerCase().includes(mentionSearch.toLowerCase())
    );

    // Filter subtasks for mention dropdown
    const filteredSubtasks = (task.subtasks || []).filter(s =>
        s.title.toLowerCase().includes(mentionSearch.toLowerCase())
    );

    const scrollToSubtask = (subtaskId: string) => {
        const subtaskElement = document.getElementById(`subtask-${subtaskId}`);
        if (subtaskElement) {
            subtaskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            subtaskElement.classList.add('ring-2', 'ring-[var(--brand-primary)]', 'ring-offset-2');
            setTimeout(() => {
                subtaskElement.classList.remove('ring-2', 'ring-[var(--brand-primary)]', 'ring-offset-2');
            }, 1500);
        }
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Check for @mention trigger
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtPos = textBeforeCursor.lastIndexOf('@');

        if (lastAtPos !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
            if (!textAfterAt.includes(' ')) {
                // User is typing after @, show dropdown
                setMentionSearch(textAfterAt);
                setShowMentionDropdown(true);
                setMentionPosition({ top: 100, left: lastAtPos * 8 });
            }
        } else {
            setShowMentionDropdown(false);
        }
    };

    const insertMention = (member: Member) => {
        const cursorPos = newComment.lastIndexOf('@');
        if (cursorPos !== -1) {
            const before = newComment.slice(0, cursorPos);
            const after = newComment.slice(cursorPos + mentionSearch.length + 1);
            setNewComment(before + after);
        }
        setCommentChips(prev => [...prev, { type: 'user', id: member.id, title: member.name }]);
        setShowMentionDropdown(false);
    };

    const insertSubtaskMention = (subtask: { id: string; title: string; completed: boolean }) => {
        const cursorPos = newComment.lastIndexOf('@');
        if (cursorPos !== -1) {
            const before = newComment.slice(0, cursorPos);
            const after = newComment.slice(cursorPos + mentionSearch.length + 1);
            setNewComment(before + after);
        }
        setCommentChips(prev => [...prev, { type: 'subtask', id: subtask.id, title: subtask.title, completed: subtask.completed }]);
        setShowMentionDropdown(false);
    };

    const removeCommentChip = (index: number) => {
        setCommentChips(prev => prev.filter((_, i) => i !== index));
    };

    const removeReplyChip = (index: number) => {
        setReplyChips(prev => prev.filter((_, i) => i !== index));
    };

    const insertReplyMention = (member: Member) => {
        const cursorPos = replyContent.lastIndexOf('@');
        if (cursorPos !== -1) {
            const before = replyContent.slice(0, cursorPos);
            const after = replyContent.slice(cursorPos + mentionSearch.length + 1);
            setReplyContent(before + after);
        }
        setReplyChips(prev => [...prev, { type: 'user', id: member.id, title: member.name }]);
        setShowMentionDropdown(false);
    };

    const insertReplySubtaskMention = (subtask: { id: string; title: string; completed: boolean }) => {
        const cursorPos = replyContent.lastIndexOf('@');
        if (cursorPos !== -1) {
            const before = replyContent.slice(0, cursorPos);
            const after = replyContent.slice(cursorPos + mentionSearch.length + 1);
            setReplyContent(before + after);
        }
        setReplyChips(prev => [...prev, { type: 'subtask', id: subtask.id, title: subtask.title, completed: subtask.completed }]);
        setShowMentionDropdown(false);
    };

    // Build final content with chip syntax for storage
    const buildCommentContent = (text: string, chips: { type: 'subtask' | 'user'; id: string; title: string }[]) => {
        if (chips.length === 0) return text;
        return chips.map((chip, i) => {
            const chipText = `@[${chip.type}:${chip.id}]`;
            // Interleave with text segments - chips are inline
            return i === 0 && text ? `${text} ${chipText}` : chipText;
        }).join(' ');
    };

    // Render comment content with @[subtask:id] and @[user:id] mention chips
    const renderCommentContent = (content: string) => {
        const mentionRegex = /@\[(subtask|user):([^\]]+)\]/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before the mention
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }

            const type = match[1]; // 'subtask' or 'user'
            const id = match[2];

            if (type === 'subtask') {
                const subtask = task.subtasks?.find(s => s.id === id);
                if (subtask) {
                    parts.push(
                        <button
                            key={`subtask-${match.index}`}
                            onClick={() => scrollToSubtask(subtask.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--background-subtle)] border border-[var(--brand-primary)]/30 text-[var(--brand-primary)] text-xs font-medium hover:bg-[var(--brand-primary)]/10 transition-colors"
                        >
                            <CheckIcon className={`w-3 h-3 ${subtask.completed ? 'text-green-500' : 'opacity-30'}`} />
                            {subtask.title}
                        </button>
                    );
                } else {
                    // Subtask not found, show as plain text
                    parts.push(`@[subtask:${id}]`);
                }
            } else if (type === 'user') {
                const member = workspaceMembers.find(m => m.id === id);
                if (member) {
                    parts.push(
                        <span
                            key={`user-${match.index}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--flux-info-bg)] text-[var(--flux-info-text-strong)] text-xs font-medium"
                        >
                            @{member.name}
                        </span>
                    );
                } else {
                    parts.push(`@[user:${id}]`);
                }
            }

            lastIndex = mentionRegex.lastIndex;
        }

        // Add remaining text after last mention
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }

        return parts.length > 0 ? parts : content;
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)] overflow-x-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between p-4 md:p-6 lg:p-8 border-b border-[var(--border-subtle)] bg-[var(--surface)]">
                                {error && (
                                    <div className="w-full mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3">
                                        <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        {!isReadOnly ? (
                                            <CustomSelect
                                                value={task.status}
                                                onChange={(value) => onUpdate(task.id, { status: value as TaskData['status'] })}
                                                options={statusOptions}
                                                className="min-w-[120px]"
                                            />
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-[var(--background-subtle)] text-[var(--text-secondary)] font-bold text-[10px] tracking-wider uppercase border border-[var(--border-subtle)]">
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        )}
                                        <span className="text-[11px] text-[var(--text-tertiary)]">
                                            Created {new Date(task.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                                hour: 'numeric', minute: '2-digit',
                                            })}
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
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--background)]">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                    {/* Main Content */}
                                    <div className="md:col-span-8 space-y-10">
                                        {/* Description */}
                                        <div className="group">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                                <Bars3BottomLeftIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                                                    <Squares2X2Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                                                        id={`subtask-${subtask.id}`}
                                                        className="group flex items-start gap-3 p-2 rounded-xl hover:bg-[var(--surface)] hover:shadow-sm border border-transparent hover:border-[var(--border-subtle)] transition-all"
                                                    >
                                                        <button
                                                            disabled={isReadOnly}
                                                            onClick={() => handleToggleSubtask(subtask.id)}
                                                            className={`
                                                                flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center mt-0.5
                                                                ${subtask.completed
                                                                    ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--text-inverse)] shadow-lg shadow-[var(--brand-primary)]/20'
                                                                    : 'bg-[var(--surface)] border-[var(--border-default)] text-transparent hover:border-[var(--brand-primary)]'
                                                                }
                                                            `}
                                                        >
                                                            <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <span
                                                                className={`block text-[14px] font-medium transition-all ${subtask.completed ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'
                                                                    }`}
                                                            >
                                                                {subtask.title}
                                                            </span>
                                                            {subtask.createdAt && (
                                                                <span className="block text-[11px] text-[var(--text-tertiary)] mt-0.5">
                                                                    {new Date(subtask.createdAt).toLocaleString(undefined, {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-tertiary)] hover:text-[var(--flux-error-primary)] hover:bg-[var(--flux-error-bg)] rounded-lg transition-all"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-3 p-2 group/input relative">
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            <PlusIcon className="w-4 h-4 text-[var(--text-tertiary)] group-hover/input:text-[var(--brand-primary)] transition-colors" />
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
                                                                className="px-3 py-1.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] text-xs font-bold rounded-lg hover:bg-[var(--brand-primary-hover)] transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                                                            >
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {(task.subtasks || []).length > 0 && (
                                            <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                                                <button
                                                    onClick={() => setShowSubtaskDetails(!showSubtaskDetails)}
                                                    className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                                >
                                                    <InformationCircleIcon className="w-4 h-4" />
                                                    Subtask Details
                                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSubtaskDetails ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {showSubtaskDetails && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-3 space-y-2">
                                                                {(task.subtasks || []).map((subtask) => (
                                                                    <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                                                                        <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                                            {subtask.createdBy?.image ? (
                                                                                <Image src={subtask.createdBy.image} alt="" width={24} height={24} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <span className="text-[9px] font-bold text-[var(--brand-primary)]">
                                                                                    {subtask.createdBy?.name?.charAt(0) || '?'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{subtask.title}</p>
                                                                            <p className="text-[11px] text-[var(--text-tertiary)]">
                                                                                {subtask.createdBy?.name || 'Unknown'} · {subtask.createdAt ? new Date(subtask.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown date'}
                                                                            </p>
                                                                        </div>
                                                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${subtask.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-[var(--background-subtle)] border border-[var(--border-default)]'}`}>
                                                                            {subtask.completed && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Activity */}
                                        <div className="pt-8 border-t border-[var(--border-subtle)]">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)] mb-6">
                                                <ClockIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                                                    {(() => {
                                                        // Separate top-level comments from replies
                                                        const topLevelComments = (task.comments || []).filter(c => !c.parentId);
                                                        const repliesMap = (task.comments || []).reduce((acc, c) => {
                                                            if (c.parentId) {
                                                                if (!acc[c.parentId]) acc[c.parentId] = [];
                                                                acc[c.parentId].push(c);
                                                            }
                                                            return acc;
                                                        }, {} as Record<string, typeof task.comments>);

                                                        return topLevelComments.map((comment) => (
                                                            <div key={comment.id} className="flex gap-4 group/comment relative">
                                                                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] border-2 border-white dark:border-neutral-800" />
                                                                <div className="w-9 h-9 rounded-full bg-[var(--flux-info-bg)] border border-[var(--flux-info-border)] flex-shrink-0 overflow-hidden shadow-sm">
                                                                    {comment.user?.image ? (
                                                                        <Image
                                                                            src={comment.user.image}
                                                                            alt=""
                                                                            width={36}
                                                                            height={36}
                                                                            className="w-full h-full object-cover"
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
                                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[14px] text-[var(--text-primary)] bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm leading-relaxed whitespace-pre-wrap">
                                                                        {renderCommentContent(comment.content)}
                                                                    </div>
                                                                    {/* Like, Reactions and Reply buttons */}
                                                                    <div className="flex items-center gap-3 mt-2">
                                                                        {/* Emoji Reaction Button */}
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                                                                                className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
                                                                            >
                                                                                <FaceSmileIcon className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            {/* Emoji Picker */}
                                                                            {showEmojiPicker === comment.id && (
                                                                                <div className="absolute top-full left-0 mt-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-lg p-2 flex gap-1 z-50">
                                                                                    {EMOJI_LIST.map((emoji) => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => handleAddReaction(comment.id, emoji)}
                                                                                            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--background-subtle)] rounded-lg text-lg transition-colors"
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {/* Display Reactions */}
                                                                        {(comment.reactions && comment.reactions.length > 0) && (
                                                                            <div className="flex items-center gap-1">
                                                                                {/* Group reactions by emoji */}
                                                                                {Object.entries(
                                                                                    (comment.reactions as { emoji: string; userId: string }[]).reduce((acc, r) => {
                                                                                        if (!acc[r.emoji]) acc[r.emoji] = [];
                                                                                        acc[r.emoji].push(r.userId);
                                                                                        return acc;
                                                                                    }, {} as Record<string, string[]>)
                                                                                ).map(([emoji, userIds]) => (
                                                                                    <button
                                                                                        key={emoji}
                                                                                        onClick={() => handleAddReaction(comment.id, emoji)}
                                                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                                                                            userIds.includes(session?.user?.id || '')
                                                                                                ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                                                                                                : 'bg-[var(--background-subtle)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30'
                                                                                        }`}
                                                                                    >
                                                                                        <span>{emoji}</span>
                                                                                        <span className="text-[var(--text-secondary)]">{userIds.length}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {/* Like count (legacy) */}
                                                                        {(comment.likes && comment.likes.length > 0) && (
                                                                            <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                                                                <HeartIcon className="w-3 h-3 fill-red-500 text-red-500" />
                                                                                <span>{comment.likes.length}</span>
                                                                            </span>
                                                                        )}
                                                                        {!isReadOnly && (
                                                                            <button
                                                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                                                className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
                                                                            >
                                                                                <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                                                                                Reply
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {/* Reply input */}
                                                                    {replyingTo === comment.id && (
                                                                        <div className="mt-3 flex gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-[var(--background-subtle)] border border-[var(--border-subtle)] flex-shrink-0 overflow-hidden">
                                                                                {session?.user?.image ? (
                                                                                    <Image
                                                                                        src={session.user.image}
                                                                                        alt=""
                                                                                        width={32}
                                                                                        height={32}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)] uppercase">
                                                                                        {session?.user?.name?.charAt(0) || '?'}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 relative">
                                                                                <textarea
                                                                                    value={replyContent}
                                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                                    placeholder="Write a reply..."
                                                                                    className="w-full text-[13px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-3 pr-10 focus:ring-2 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[70px] shadow-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                                                                    autoFocus
                                                                                />
                                                                                <button
                                                                                    disabled={!replyContent.trim() || isSubmittingReply}
                                                                                    onClick={() => handleReplySubmit(comment.id)}
                                                                                    className="absolute bottom-2 right-2 p-1.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                                >
                                                                                    {isSubmittingReply ? (
                                                                                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                                                                    ) : (
                                                                                        <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {/* Replies */}
                                                                    {repliesMap[comment.id]?.map((reply) => (
                                                                        <div key={reply.id} className="flex gap-3 mt-4 pl-4 border-l-2 border-[var(--border-subtle)]">
                                                                            <div className="w-8 h-8 rounded-full bg-[var(--flux-info-bg)] border border-[var(--flux-info-border)] flex-shrink-0 overflow-hidden shadow-sm">
                                                                                {reply.user?.image ? (
                                                                                    <Image
                                                                                        src={reply.user.image}
                                                                                        alt=""
                                                                                        width={32}
                                                                                        height={32}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--flux-info-text-strong)] uppercase">
                                                                                        {reply.user?.name?.charAt(0) || '?'}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
                                                                                        {reply.user?.name || 'Unknown User'}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">
                                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-[13px] text-[var(--text-primary)] bg-[var(--surface)] rounded-xl p-3 border border-[var(--border-subtle)] shadow-sm leading-relaxed">
                                                                                    {renderCommentContent(reply.content)}
                                                                                </div>
                                                                                {/* Reactions for replies */}
                                                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                                                    {/* Emoji Reaction Button for reply */}
                                                                                    <button
                                                                                        onClick={() => setShowEmojiPicker(showEmojiPicker === `reply-${reply.id}` ? null : `reply-${reply.id}`)}
                                                                                        className="flex items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
                                                                                    >
                                                                                        <FaceSmileIcon className="w-3 h-3" />
                                                                                    </button>
                                                                                    {/* Emoji Picker for reply */}
                                                                                    {showEmojiPicker === `reply-${reply.id}` && (
                                                                                        <div className="absolute top-full left-0 mt-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg p-1 flex gap-0.5 z-50">
                                                                                            {EMOJI_LIST.map((emoji) => (
                                                                                                <button
                                                                                                    key={emoji}
                                                                                                    onClick={() => handleAddReaction(reply.id, emoji)}
                                                                                                    className="w-6 h-6 flex items-center justify-center hover:bg-[var(--background-subtle)] rounded text-sm transition-colors"
                                                                                                >
                                                                                                    {emoji}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                    {/* Display Reactions for reply */}
                                                                                    {(reply.reactions && reply.reactions.length > 0) && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            {Object.entries(
                                                                                                (reply.reactions as { emoji: string; userId: string }[]).reduce((acc, r) => {
                                                                                                    if (!acc[r.emoji]) acc[r.emoji] = [];
                                                                                                    acc[r.emoji].push(r.userId);
                                                                                                    return acc;
                                                                                                }, {} as Record<string, string[]>)
                                                                                            ).map(([emoji, userIds]) => (
                                                                                                <button
                                                                                                    key={emoji}
                                                                                                    onClick={() => handleAddReaction(reply.id, emoji)}
                                                                                                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-xs border transition-colors ${
                                                                                                        userIds.includes(session?.user?.id || '')
                                                                                                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                                                                                                            : 'bg-[var(--background-subtle)] border-[var(--border-subtle)]'
                                                                                                    }`}
                                                                                                >
                                                                                                    <span>{emoji}</span>
                                                                                                    <span className="text-[var(--text-secondary)]">{userIds.length}</span>
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                    {/* Legacy like count */}
                                                                                    {(reply.likes && reply.likes.length > 0) && (
                                                                                        <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                                                                            <HeartIcon className="w-3 h-3 fill-red-500 text-red-500" />
                                                                                            <span>{reply.likes.length}</span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}

                                                    {!isReadOnly && (
                                                        <div className="flex gap-4 pt-2">
                                                            <div className="w-10 h-10 rounded-full bg-[var(--background-subtle)] border border-[var(--border-subtle)] flex-shrink-0 overflow-hidden shadow-sm">
                                                                {session?.user?.image ? (
                                                                    <Image
                                                                        src={session.user.image}
                                                                        alt=""
                                                                        width={40}
                                                                        height={40}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] uppercase">
                                                                        {session?.user?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 relative flex flex-col gap-2">
                                                                {/* Chips */}
                                                                {commentChips.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {commentChips.map((chip, i) => (
                                                                            <div
                                                                                key={`${chip.type}-${chip.id}-${i}`}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                                                                    chip.type === 'subtask'
                                                                                        ? 'bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 text-[var(--brand-primary)]'
                                                                                        : 'bg-[var(--flux-info-bg)] border border-[var(--flux-info-border)] text-[var(--flux-info-text-strong)]'
                                                                                }`}
                                                                            >
                                                                                {chip.type === 'subtask' ? (
                                                                                    <CheckIcon className={`w-3 h-3 ${chip.completed ? 'text-green-500' : 'opacity-40'}`} />
                                                                                ) : (
                                                                                    <span className="text-[10px] font-bold">@</span>
                                                                                )}
                                                                                <span className="truncate max-w-[120px]">{chip.title}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeCommentChip(i)}
                                                                                    className="ml-1 hover:bg-black/10 rounded p-0.5"
                                                                                >
                                                                                    <XMarkIcon className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <textarea
                                                                    value={newComment}
                                                                    onChange={handleCommentChange}
                                                                    placeholder="Write a comment... (@mention someone or subtask)"
                                                                    className="w-full text-[14px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 pr-12 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[100px] shadow-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                                                />
                                                                {/* Mention Dropdown */}
                                                                {showMentionDropdown && (filteredMembers.length > 0 || filteredSubtasks.length > 0) ? (
                                                                    <div className="absolute bottom-full left-0 mb-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-lg max-h-64 overflow-y-auto z-50 w-full">
                                                                        {filteredMembers.length > 0 ? (
                                                                            <div>
                                                                                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                                                                                    Members
                                                                                </div>
                                                                                {filteredMembers.map((member) => (
                                                                                    <button
                                                                                        key={member.id}
                                                                                        onClick={() => insertMention(member)}
                                                                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--background-subtle)] transition-colors text-left"
                                                                                    >
                                                                                        <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)] overflow-hidden flex-shrink-0">
                                                                                            {member.image ? (
                                                                                                <Image src={member.image} alt="" width={24} height={24} className="w-full h-full object-cover" />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                                                                                                    {member.name?.charAt(0) || '?'}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{member.name}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        ) : null}
                                                                        {filteredSubtasks.length > 0 ? (
                                                                            <div>
                                                                                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                                                                                    Subtasks
                                                                                </div>
                                                                                {filteredSubtasks.map((subtask) => (
                                                                                    <button
                                                                                        key={subtask.id}
                                                                                        onClick={() => insertSubtaskMention(subtask)}
                                                                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--background-subtle)] transition-colors text-left"
                                                                                    >
                                                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${subtask.completed ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white' : 'border-[var(--border-default)]'}`}>
                                                                                            {subtask.completed ? <CheckIcon className="w-3 h-3 stroke-[3]" /> : null}
                                                                                        </div>
                                                                                        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{subtask.title}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                ) : null}
                                                                <button
                                                                    disabled={!newComment.trim() || isSubmittingComment}
                                                                    onClick={handleAddComment}
                                                                    className="absolute bottom-3 right-3 p-2 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl hover:shadow-lg hover:shadow-[var(--brand-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    {isSubmittingComment ? (
                                                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <PaperAirplaneIcon className="w-4 h-4" />
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
                                                <TagIcon className="w-3.5 h-3.5" />
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
                                                            className={`w-2 h-2 rounded-full ${task.categoryId === cat.id ? 'bg-[var(--text-inverse)]' : ''}`}
                                                            style={{ backgroundColor: task.categoryId === cat.id ? undefined : cat.color }}
                                                        />
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                Due Date
                                            </div>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const dateValue = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                                                    onUpdate(task.id, { dueDate: dateValue });
                                                }}
                                                className="input text-sm"
                                            />
                                            {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'ARCHIVED' && (
                                                <p className="text-xs text-red-500 mt-2 font-medium">This task is overdue!</p>
                                            )}
                                        </div>

                                        {/* Links */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <LinkIcon className="w-3.5 h-3.5" />
                                                Links
                                            </div>
                                            {/* Existing Links */}
                                            {(task.links || []).length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    {task.links?.map((link) => (
                                                        <div key={link.id} className="flex items-center justify-between group bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2">
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-[var(--brand-primary)] hover:underline truncate flex-1"
                                                            >
                                                                {link.title || link.url}
                                                            </a>
                                                            {!isReadOnly && (
                                                                <button
                                                                    onClick={() => handleDeleteLink(link.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Add Link */}
                                            {!isReadOnly && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="url"
                                                        placeholder="https://..."
                                                        value={newLinkUrl}
                                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                                        className="input text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Link title (optional)"
                                                        value={newLinkTitle}
                                                        onChange={(e) => setNewLinkTitle(e.target.value)}
                                                        className="input text-sm"
                                                    />
                                                    <button
                                                        onClick={handleAddLink}
                                                        disabled={!newLinkUrl.trim()}
                                                        className="btn btn-secondary w-full text-sm"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                        Add Link
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Priority */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <Bars3BottomLeftIcon className="w-3.5 h-3.5 rotate-90" />
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
                                                        {task.priority === p && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                                                <UserPlusIcon className="w-3.5 h-3.5" />
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
                                                                        <Image
                                                                            src={member.image}
                                                                            alt=""
                                                                            width={32}
                                                                            height={32}
                                                                            className="w-full h-full object-cover"
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
                                                                    {isAssigned && <CheckIcon className="w-3 h-3 stroke-[3]" />}
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
