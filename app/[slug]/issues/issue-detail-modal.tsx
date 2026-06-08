'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    Bars3BottomLeftIcon,
    ClockIcon,
    UserPlusIcon,
    TagIcon,
    CheckIcon,
    ExclamationCircleIcon,
    BugAntIcon,
    LightBulbIcon,
    BoltIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    FlagIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import CustomSelect from '@/components/ui/custom-select';

type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IssueType = 'BUG' | 'FEATURE' | 'IMPROVEMENT';

export interface IssueComment {
    id: string;
    content: string;
    userId: string;
    user: { id: string; name: string; email: string; image: string | null };
    createdAt: string;
}

interface IssuePerson {
    name: string;
    image?: string;
}

interface Issue {
    _id: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    reporter: IssuePerson;
    assignee?: IssuePerson;
    comments: IssueComment[];
    createdAt: string;
}

interface WorkspaceMember {
    userId: string;
    user: {
        name: string;
        email: string;
        image?: string;
    } | null;
}

type IssueUpdateData = Partial<{
    title: string;
    description: string;
    priority: IssuePriority;
    type: IssueType;
    status: IssueStatus;
    assigneeId: string | null;
}>;

interface IssueDetailModalProps {
    issue: Issue;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (issueId: string, data: IssueUpdateData) => void;
    onAddComment: (issueId: string, content: string) => Promise<void>;
    members?: WorkspaceMember[];
    isReadOnly?: boolean;
}

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
    { value: 'BUG', label: 'Bug' },
    { value: 'FEATURE', label: 'Feature' },
    { value: 'IMPROVEMENT', label: 'Improvement' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
];

const STATUS_META: Record<IssueStatus, { label: string; dot: string }> = {
    OPEN: { label: 'Open', dot: 'var(--text-tertiary)' },
    IN_PROGRESS: { label: 'In Progress', dot: '#3b82f6' },
    RESOLVED: { label: 'Resolved', dot: '#22c55e' },
    CLOSED: { label: 'Closed', dot: 'var(--text-tertiary)' },
};

const PRIORITY_BADGE: Record<IssuePriority, string> = {
    LOW: 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
    MEDIUM: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    HIGH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

function getTypeIcon(type: IssueType) {
    switch (type) {
        case 'BUG': return <BugAntIcon className="w-4 h-4 text-red-500" />;
        case 'FEATURE': return <LightBulbIcon className="w-4 h-4 text-amber-500" />;
        case 'IMPROVEMENT': return <BoltIcon className="w-4 h-4 text-blue-500" />;
        default: return <ExclamationCircleIcon className="w-4 h-4" />;
    }
}

function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Avatar({ name, image, size = 36 }: { name: string; image?: string | null; size?: number }) {
    return (
        <div
            className="rounded-full bg-[var(--background-subtle)] border border-[var(--border-subtle)] flex-shrink-0 overflow-hidden shadow-sm"
            style={{ width: size, height: size }}
        >
            {image ? (
                <Image src={image} alt="" width={size} height={size} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                    {name?.charAt(0) || '?'}
                </div>
            )}
        </div>
    );
}

export function IssueDetailModal({
    issue,
    isOpen,
    onClose,
    onUpdate,
    onAddComment,
    members = [],
    isReadOnly = false,
}: IssueDetailModalProps) {
    const { data: session } = useSession();
    const [title, setTitle] = useState(issue.title);
    const [description, setDescription] = useState(issue.description || '');
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle(issue.title);
        setDescription(issue.description || '');
    }, [issue]);

    const handleSaveTitle = () => {
        const next = title.trim();
        if (next && next !== issue.title) {
            onUpdate(issue._id, { title: next });
        } else if (!next) {
            setTitle(issue.title);
        }
    };

    const handleSaveDescription = () => {
        if (description.trim() !== (issue.description || '')) {
            onUpdate(issue._id, { description });
        }
    };

    const assignedMember = members.find((m) => m.user?.name === issue.assignee?.name);

    const handleSetAssignee = (memberId: string) => {
        const isAssigned = assignedMember?.userId === memberId;
        onUpdate(issue._id, { assigneeId: isAssigned ? null : memberId });
    };

    const handleSubmitComment = async () => {
        const content = newComment.trim();
        if (!content || isSubmittingComment) return;
        setIsSubmittingComment(true);
        const sent = newComment;
        setNewComment('');
        try {
            await onAddComment(issue._id, content);
            requestAnimationFrame(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
        } catch {
            // Restore the composer so the user doesn't lose their text.
            setNewComment(sent);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)]"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 p-4 md:p-6 border-b border-[var(--border-subtle)] bg-[var(--surface)]">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-2.5">
                                    <span className="px-2.5 py-1 rounded-md bg-[var(--background-subtle)] text-[var(--text-secondary)] font-bold text-[10px] tracking-wider uppercase border border-[var(--border-subtle)] flex items-center gap-1.5">
                                        {getTypeIcon(issue.type)} {issue.type}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase border flex items-center gap-1.5 ${PRIORITY_BADGE[issue.priority]}`}>
                                        <FlagIcon className="w-3 h-3" /> {issue.priority}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    readOnly={isReadOnly}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    className="w-full text-xl md:text-2xl font-bold bg-transparent border border-transparent rounded-lg -ml-2 px-2 py-1 focus:outline-none focus:border-[var(--border-subtle)] focus:bg-[var(--background-subtle)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                    placeholder="Feedback title"
                                />
                                <div className="text-xs text-[var(--text-tertiary)] mt-2 font-medium px-0.5">
                                    #{issue._id.slice(-6)} &bull; Reported by {issue.reporter?.name || 'A teammate'}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="p-2 rounded-xl hover:bg-[var(--background-subtle)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto bg-[var(--background)] custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 p-4 md:p-6">
                                {/* Main Content */}
                                <div className="md:col-span-8 space-y-8 min-w-0">
                                    {/* Description */}
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                            <Bars3BottomLeftIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                            Description
                                        </div>
                                        <textarea
                                            value={description}
                                            readOnly={isReadOnly}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={handleSaveDescription}
                                            placeholder={isReadOnly ? 'No description provided.' : 'Add a more detailed description...'}
                                            className="w-full min-h-[140px] text-[15px] text-[var(--text-primary)] leading-relaxed bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all resize-y placeholder-[var(--text-tertiary)]"
                                        />
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-4">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                            Comments
                                            {issue.comments.length > 0 && (
                                                <span className="text-xs font-medium text-[var(--text-tertiary)]">({issue.comments.length})</span>
                                            )}
                                        </div>

                                        <div className="space-y-5">
                                            {issue.comments.length === 0 ? (
                                                <p className="text-[13px] text-[var(--text-tertiary)] italic py-2">
                                                    No comments yet — start the conversation.
                                                </p>
                                            ) : (
                                                issue.comments.map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className={`flex gap-3 transition-opacity ${comment.id.startsWith('temp-') ? 'opacity-60' : ''}`}
                                                    >
                                                        <Avatar name={comment.user?.name} image={comment.user?.image} size={36} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                                                                    {comment.user?.name || 'Unknown User'}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">
                                                                    {formatRelative(comment.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className="text-[14px] text-[var(--text-primary)] bg-[var(--surface)] rounded-2xl rounded-tl-sm p-3.5 border border-[var(--border-subtle)] shadow-sm leading-relaxed whitespace-pre-wrap break-words">
                                                                {comment.content}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <div ref={commentsEndRef} />
                                        </div>

                                        {/* Composer */}
                                        {!isReadOnly && (
                                            <div className="flex gap-3 mt-5">
                                                <Avatar name={session?.user?.name || ''} image={session?.user?.image} size={36} />
                                                <div className="flex-1 relative">
                                                    <textarea
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleSubmitComment();
                                                            }
                                                        }}
                                                        placeholder="Write a comment..."
                                                        className="w-full text-[14px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all resize-none min-h-[72px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={!newComment.trim() || isSubmittingComment}
                                                        onClick={handleSubmitComment}
                                                        aria-label="Send comment"
                                                        className="absolute bottom-2.5 right-2.5 p-2 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--brand-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <PaperAirplaneIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timeline */}
                                    <div className="pt-6 border-t border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                            <ClockIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                            Timeline
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                                            Reported on {new Date(issue.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="md:col-span-4 space-y-6 mt-8 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)]">
                                    {/* Status */}
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                                            <TagIcon className="w-3.5 h-3.5" />
                                            Status
                                        </div>
                                        <div className="space-y-2">
                                            {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => {
                                                const active = issue.status === s;
                                                return (
                                                    <button
                                                        key={s}
                                                        disabled={isReadOnly}
                                                        onClick={() => onUpdate(issue._id, { status: s })}
                                                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                                                            active
                                                                ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30'
                                                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] disabled:opacity-60'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[s].dot }} />
                                                            {STATUS_META[s].label}
                                                        </span>
                                                        {active && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Type & Priority */}
                                    {!isReadOnly && (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Type</div>
                                                <CustomSelect
                                                    value={issue.type}
                                                    onChange={(v) => onUpdate(issue._id, { type: v as IssueType })}
                                                    options={TYPE_OPTIONS}
                                                    minWidth="100%"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Priority</div>
                                                <CustomSelect
                                                    value={issue.priority}
                                                    onChange={(v) => onUpdate(issue._id, { priority: v as IssuePriority })}
                                                    options={PRIORITY_OPTIONS}
                                                    minWidth="100%"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignee */}
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                                            <UserPlusIcon className="w-3.5 h-3.5" />
                                            Assignee
                                        </div>
                                        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                                            <div className="divide-y divide-[var(--border-subtle)] max-h-[240px] overflow-y-auto custom-scrollbar">
                                                {members.map((member) => {
                                                    const isAssigned = assignedMember?.userId === member.userId;
                                                    return (
                                                        <button
                                                            key={member.userId}
                                                            disabled={isReadOnly}
                                                            onClick={() => handleSetAssignee(member.userId)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left disabled:cursor-default ${
                                                                isAssigned ? 'bg-[var(--brand-primary)]/5' : 'hover:bg-[var(--background-subtle)]'
                                                            }`}
                                                        >
                                                            <Avatar name={member.user?.name || ''} image={member.user?.image} size={32} />
                                                            <p className={`flex-1 min-w-0 text-[13px] font-semibold truncate ${isAssigned ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                                                {member.user?.name || 'Unknown User'}
                                                            </p>
                                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                                isAssigned
                                                                    ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--text-inverse)]'
                                                                    : 'border-[var(--border-default)] bg-[var(--surface)]'
                                                            }`}>
                                                                {isAssigned && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                                                            </span>
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
            )}
        </AnimatePresence>
    );
}
