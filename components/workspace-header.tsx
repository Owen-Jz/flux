'use client';

import { useState, useEffect } from 'react';
import { BellIcon, ChatBubbleLeftRightIcon, XMarkIcon, CheckIcon, ClockIcon, UserIcon, ExclamationCircleIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { getActivities, getCommentActivities, markActivityAsRead, markAllActivitiesAsRead, getUnreadActivityCount } from '@/actions/activity';

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    metadata?: {
        taskTitle?: string;
        boardSlug?: string;
        boardName?: string;
        previousStatus?: string;
        newStatus?: string;
        commentContent?: string;
    };
    taskId?: string;
    boardSlug?: string;
    read: boolean;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        image?: string;
    } | null;
}

interface CommentActivity {
    id: string;
    content: string;
    taskTitle: string;
    taskId?: string;
    boardSlug?: string;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        image?: string;
    } | null;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'TASK_CREATED':
            return <CheckIcon className="w-4 h-4 text-[var(--success-primary)]" />;
        case 'TASK_MOVED':
            return <ArrowRightIcon className="w-4 h-4 text-[var(--info-primary)]" />;
        case 'TASK_ASSIGNED':
            return <UserIcon className="w-4 h-4 text-[var(--brand-primary)]" />;
        case 'COMMENT_ADDED':
            return <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--info-primary)]" />;
        case 'TASK_DELETED':
            return <XMarkIcon className="w-4 h-4 text-[var(--error-primary)]" />;
        default:
            return <BellIcon className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
}

export function WorkspaceHeader() {
    const params = useParams();
    const router = useRouter();
    const workspaceSlug = params?.slug as string;

    const [showNotifications, setShowNotifications] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [comments, setComments] = useState<CommentActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [initialUnreadCount, setInitialUnreadCount] = useState(0);

    const unreadCount = activities.length > 0 ? activities.filter(a => !a.read).length : initialUnreadCount;

    // Fetch activities and unread count on mount
    useEffect(() => {
        if (workspaceSlug) {
            // Get initial unread count
            getUnreadActivityCount(workspaceSlug).then(setInitialUnreadCount);

            // Fetch activities
            setIsLoadingActivities(true);
            getActivities(workspaceSlug, 20)
                .then(setActivities)
                .finally(() => setIsLoadingActivities(false));

            getCommentActivities(workspaceSlug, 20)
                .then(setComments)
                .finally(() => setIsLoadingComments(false));
        }
    }, [workspaceSlug]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!workspaceSlug) return;

        const pollInterval = setInterval(() => {
            getUnreadActivityCount(workspaceSlug).then(setInitialUnreadCount);
            // Also refresh activities if notifications dropdown is open
            if (showNotifications) {
                getActivities(workspaceSlug, 20).then(setActivities);
            }
            if (showComments) {
                getCommentActivities(workspaceSlug, 20).then(setComments);
            }
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [workspaceSlug, showNotifications, showComments]);

    // Refetch activities when dropdown opens to get latest
    useEffect(() => {
        if (showNotifications && workspaceSlug) {
            getActivities(workspaceSlug, 20).then(setActivities);
        }
    }, [showNotifications, workspaceSlug]);

    // Refetch comments when dropdown opens to get latest
    useEffect(() => {
        if (showComments && workspaceSlug) {
            getCommentActivities(workspaceSlug, 20).then(setComments);
        }
    }, [showComments, workspaceSlug]);

    const handleMarkAllAsRead = async () => {
        if (!workspaceSlug) return;
        await markAllActivitiesAsRead(workspaceSlug);
        setActivities(activities.map(a => ({ ...a, read: true })));
        setInitialUnreadCount(0);
    };

    const handleMarkAsRead = async (id: string) => {
        await markActivityAsRead(id, workspaceSlug);
        setActivities(activities.map(a =>
            a.id === id ? { ...a, read: true } : a
        ));
        setInitialUnreadCount(Math.max(0, initialUnreadCount - 1));
    };

    const handleActivityClick = (activity: Activity) => {
        handleMarkAsRead(activity.id);
        if (activity.boardSlug && activity.taskId) {
            // Navigate to the board - the task can be found there
            router.push(`/${workspaceSlug}/board/${activity.boardSlug}`);
            setShowNotifications(false);
        }
    };

    const handleCommentClick = (comment: CommentActivity) => {
        if (comment.boardSlug && comment.taskId) {
            router.push(`/${workspaceSlug}/board/${comment.boardSlug}`);
            setShowComments(false);
        }
    };

    if (!workspaceSlug) return null;

    return (
        <div className="hidden md:flex items-center gap-2">
            {/* Comments Button */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowComments(!showComments);
                        setShowNotifications(false);
                    }}
                    className="relative p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--border-default)] transition-all group"
                    title="Recent Comments"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-colors" />
                </button>

                <AnimatePresence>
                    {showComments && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowComments(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-96 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                                    <h3 className="font-bold text-[var(--text-primary)]">Recent Comments</h3>
                                    <button
                                        onClick={() => setShowComments(false)}
                                        className="p-1 rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                                    >
                                        <XMarkIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                    </button>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {isLoadingComments ? (
                                        <div className="p-8 text-center">
                                            <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                                            <p className="text-sm text-[var(--text-tertiary)] mt-2">Loading comments...</p>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <ChatBubbleLeftRightIcon className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                                            <p className="text-sm text-[var(--text-tertiary)]">No comments yet</p>
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">Comments will appear here when team members add them</p>
                                        </div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div
                                                key={comment.id}
                                                onClick={() => handleCommentClick(comment)}
                                                className="p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--background-subtle)] transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {comment.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                                {comment.user?.name || 'Unknown'}
                                                            </span>
                                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                                {formatTimeAgo(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                                            {comment.content}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                                            on <span className="font-medium text-[var(--text-secondary)]">{comment.taskTitle}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Notifications Button */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowComments(false);
                    }}
                    className="relative p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--border-default)] transition-all group"
                    title="Notifications"
                >
                    <BellIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--error-primary)] text-[var(--text-inverse)] text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotifications(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-96 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                                    <h3 className="font-bold text-[var(--text-primary)]">Activity Log</h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-xs text-[var(--brand-primary)] font-medium hover:underline"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            className="p-1 rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                                        >
                                            <XMarkIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {isLoadingActivities ? (
                                        <div className="p-8 text-center">
                                            <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                                            <p className="text-sm text-[var(--text-tertiary)] mt-2">Loading activities...</p>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <BellIcon className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                                            <p className="text-sm text-[var(--text-tertiary)]">No activities yet</p>
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">Activities will appear here as changes are made</p>
                                        </div>
                                    ) : (
                                        activities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                onClick={() => handleActivityClick(activity)}
                                                className={`p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--background-subtle)] transition-colors cursor-pointer ${!activity.read ? 'bg-info-bg/50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!activity.read ? 'bg-[var(--surface)] shadow-sm' : 'bg-[var(--background-subtle)]'
                                                        }`}>
                                                        {getActivityIcon(activity.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={`text-sm font-semibold ${!activity.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                                                }`}>
                                                                {activity.title}
                                                            </span>
                                                            {!activity.read && (
                                                                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                                            {activity.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {activity.user && (
                                                                <span className="text-xs text-[var(--text-tertiary)]">
                                                                    by {activity.user.name}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                                • {formatTimeAgo(activity.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
