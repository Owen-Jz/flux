'use client';

import { useEffect, useState } from 'react';
import { getUnreadActivityCount, markAllActivitiesAsRead } from '@/actions/activity';

interface WorkspaceUnreadDotProps {
    workspaceSlug: string;
}

export function WorkspaceUnreadDot({ workspaceSlug }: WorkspaceUnreadDotProps) {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // Fetch and mark as read on mount
        const fetchAndMarkAsRead = async () => {
            try {
                const [count] = await Promise.all([
                    getUnreadActivityCount(workspaceSlug),
                    markAllActivitiesAsRead(workspaceSlug),
                ]);
                setHasUnread(count > 0);
            } catch {
                // If mark failed, just show dot based on current count
                const count = await getUnreadActivityCount(workspaceSlug);
                setHasUnread(count > 0);
            }
        };
        fetchAndMarkAsRead();
    }, [workspaceSlug]);

    if (!hasUnread) return null;

    return (
        <span className="ml-2 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[var(--error-primary)]" />
    );
}
