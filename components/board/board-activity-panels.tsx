'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
    XMarkIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleLeftIcon,
    BellIcon,
    ArrowPathIcon,
    CheckIcon,
    PlusCircleIcon,
    ArrowsRightLeftIcon,
    UserPlusIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    TagIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import {
    getBoardActivities,
    getBoardCommentActivities,
    markActivityAsRead,
    markAllActivitiesAsReadForBoard,
} from '@/actions/activity';

/** Compact "x ago" formatter. Keeps the panels dependency-free. */
function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface PanelUser {
    id: string;
    name: string;
    image?: string | null;
}

interface CommentActivity {
    id: string;
    content: string;
    taskTitle: string;
    taskId?: string;
    boardSlug?: string;
    createdAt: string;
    user: PanelUser | null;
}

interface BoardActivity {
    id: string;
    type: string;
    title: string;
    description: string;
    taskId?: string;
    read: boolean;
    createdAt: string;
    user: PanelUser | null;
}

function Avatar({ user, size = 32 }: { user: PanelUser | null; size?: number }) {
    const dim = `${size}px`;
    if (user?.image) {
        return (
            <Image
                src={user.image}
                alt={user.name}
                width={size}
                height={size}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: dim, height: dim }}
            />
        );
    }
    return (
        <div
            className="rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] flex items-center justify-center font-bold flex-shrink-0"
            style={{ width: dim, height: dim, fontSize: size * 0.4 }}
            aria-hidden="true"
        >
            {(user?.name?.charAt(0) || '?').toUpperCase()}
        </div>
    );
}

/** Shared slide-over shell so both panels look and behave identically. */
function PanelShell({
    onClose,
    children,
}: {
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed inset-y-0 right-0 w-full md:w-96 max-w-full bg-[var(--surface)] shadow-2xl z-50 flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {children}
            </motion.div>
        </>
    );
}

function LoadingState() {
    return (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Comments panel
// ---------------------------------------------------------------------------

interface CommentsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceSlug: string;
    boardSlug: string;
    currentUserId?: string;
    onOpenTask: (taskId?: string) => void;
}

export function CommentsPanel({ isOpen, onClose, workspaceSlug, boardSlug, currentUserId, onOpenTask }: CommentsPanelProps) {
    const [comments, setComments] = useState<CommentActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setLoading(true);
        setError(false);
        getBoardCommentActivities(workspaceSlug, boardSlug, 50)
            .then((data) => {
                if (!cancelled) setComments(data as CommentActivity[]);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, workspaceSlug, boardSlug]);

    return (
        <AnimatePresence>
            {isOpen && (
                <PanelShell onClose={onClose}>
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--foreground)]">Comments</h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {loading ? 'Loading…' : `${comments.length} on this board`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--background-subtle)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                            aria-label="Close comments"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
                            Couldn&apos;t load comments. Please try again.
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto mb-4">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--brand-primary)]/50" />
                                </div>
                                <h4 className="font-semibold text-[var(--foreground)] mb-2">No comments yet</h4>
                                <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                                    Open any task and add a comment — every comment on this board shows up here.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-2">
                            {comments.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => onOpenTask(c.taskId)}
                                    className="w-full text-left flex gap-3 p-3 rounded-xl hover:bg-[var(--background-subtle)] transition-colors"
                                >
                                    <Avatar user={c.user} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                                                {c.user?.id === currentUserId ? 'You' : c.user?.name ?? 'Someone'}
                                            </span>
                                            <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">
                                                {timeAgo(c.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5 break-words">
                                            {c.content}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1.5 text-[11px] font-medium text-[var(--brand-primary)]">
                                            <ChatBubbleLeftIcon className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{c.taskTitle}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </PanelShell>
            )}
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Notifications panel
// ---------------------------------------------------------------------------

function activityIcon(type: string) {
    const cls = 'w-4 h-4';
    switch (type) {
        case 'TASK_CREATED':
            return <PlusCircleIcon className={`${cls} text-green-500`} />;
        case 'TASK_MOVED':
            return <ArrowsRightLeftIcon className={`${cls} text-blue-500`} />;
        case 'TASK_ASSIGNED':
            return <UserPlusIcon className={`${cls} text-[var(--brand-primary)]`} />;
        case 'COMMENT_ADDED':
            return <ChatBubbleLeftIcon className={`${cls} text-amber-500`} />;
        case 'SUBTASK_COMPLETED':
            return <CheckCircleIcon className={`${cls} text-green-500`} />;
        case 'CATEGORY_CHANGED':
            return <TagIcon className={`${cls} text-purple-500`} />;
        case 'TASK_DELETED':
            return <TrashIcon className={`${cls} text-red-500`} />;
        default:
            return <PencilSquareIcon className={`${cls} text-[var(--text-secondary)]`} />;
    }
}

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceSlug: string;
    boardSlug: string;
    onOpenTask: (taskId?: string) => void;
    /** Lets the board refresh its unread badge after a mutation here. */
    onUnreadChange?: () => void;
}

export function NotificationsPanel({ isOpen, onClose, workspaceSlug, boardSlug, onOpenTask, onUnreadChange }: NotificationsPanelProps) {
    const [activities, setActivities] = useState<BoardActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setLoading(true);
        setError(false);
        getBoardActivities(workspaceSlug, boardSlug, 50)
            .then((data) => {
                if (!cancelled) setActivities(data as BoardActivity[]);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, workspaceSlug, boardSlug]);

    const unreadCount = activities.filter((a) => !a.read).length;

    const handleItemClick = useCallback(
        async (activity: BoardActivity) => {
            if (!activity.read) {
                setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, read: true } : a)));
                markActivityAsRead(activity.id, workspaceSlug)
                    .then(() => onUnreadChange?.())
                    .catch(() => {
                        // Re-mark unread on failure so the badge stays honest.
                        setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, read: false } : a)));
                    });
            }
            onOpenTask(activity.taskId);
        },
        [workspaceSlug, onOpenTask, onUnreadChange]
    );

    const handleMarkAllRead = useCallback(async () => {
        setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
        try {
            await markAllActivitiesAsReadForBoard(workspaceSlug, boardSlug);
            onUnreadChange?.();
        } catch {
            setError(true);
        }
    }, [workspaceSlug, boardSlug, onUnreadChange]);

    return (
        <AnimatePresence>
            {isOpen && (
                <PanelShell onClose={onClose}>
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <BellIcon className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--foreground)]">Notifications</h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--background-subtle)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                            aria-label="Close notifications"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
                            Couldn&apos;t load notifications. Please try again.
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                    <BellIcon className="w-8 h-8 text-purple-500/50" />
                                </div>
                                <h4 className="font-semibold text-[var(--foreground)] mb-2">All caught up!</h4>
                                <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                                    Activity on this board — new tasks, moves, assignments, and comments — appears here.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-2">
                            {activities.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => handleItemClick(a)}
                                    className={`w-full text-left flex gap-3 p-3 rounded-xl transition-colors ${
                                        a.read ? 'hover:bg-[var(--background-subtle)]' : 'bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--background-subtle)] flex items-center justify-center flex-shrink-0">
                                        {activityIcon(a.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-sm font-semibold text-[var(--foreground)] truncate">{a.title}</span>
                                            <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">{timeAgo(a.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5 break-words">
                                            {a.description}
                                        </p>
                                        {a.user && (
                                            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">by {a.user.name}</p>
                                        )}
                                    </div>
                                    {!a.read && (
                                        <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--brand-primary)] flex-shrink-0" aria-label="Unread" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-4 border-t border-[var(--border-subtle)] flex-shrink-0">
                        <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="w-full py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Mark all as read
                        </button>
                    </div>
                </PanelShell>
            )}
        </AnimatePresence>
    );
}
