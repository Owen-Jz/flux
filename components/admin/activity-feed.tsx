'use client';

import { motion } from 'framer-motion';
import { BoltIcon } from '@heroicons/react/24/outline';

interface ActivityItem {
    id: string;
    action: string;
    targetType: string;
    createdAt: Date;
    metadata?: Record<string, any>;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    maxItems?: number;
    emptyMessage?: string;
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

export function ActivityFeed({
    activities,
    maxItems,
    emptyMessage = 'No recent activity',
}: ActivityFeedProps) {
    const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <BoltIcon className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-zinc-50">Recent Activity</h2>
            </div>

            <div className="space-y-3">
                {displayActivities.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                            <BoltIcon className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">{emptyMessage}</p>
                    </div>
                ) : (
                    displayActivities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                        >
                            {/* Activity dot */}
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-500 animate-ping opacity-50" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50 transition-colors">
                                    {activity.action.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Target: {activity.targetType}
                                </p>
                            </div>

                            {/* Time badge */}
                            <div className="text-right">
                                <span className="text-xs text-zinc-500">
                                    {formatTimeAgo(new Date(activity.createdAt))}
                                </span>
                                <p className="text-xs text-zinc-600">
                                    {new Date(activity.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}