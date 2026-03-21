'use client';

import { useEffect, useState } from 'react';
import { getUnreadActivityCountForBoard, markAllActivitiesAsReadForBoard } from '@/actions/activity';

interface BoardUnreadDotProps {
    workspaceSlug: string;
    boardSlug: string;
}

export function BoardUnreadDot({ workspaceSlug, boardSlug }: BoardUnreadDotProps) {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const fetchAndMarkAsRead = async () => {
            try {
                // Fetch count first
                const count = await getUnreadActivityCountForBoard(workspaceSlug, boardSlug);
                // Then mark as read (fire and forget)
                markAllActivitiesAsReadForBoard(workspaceSlug, boardSlug).catch(() => {});
                setHasUnread(count > 0);
            } catch {
                // If fetch fails, try again without marking
                const count = await getUnreadActivityCountForBoard(workspaceSlug, boardSlug);
                setHasUnread(count > 0);
            }
        };
        fetchAndMarkAsRead();
    }, [workspaceSlug, boardSlug]);

    if (!hasUnread) return null;

    return (
        <span className="ml-2 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[var(--error-primary)]" />
    );
}
