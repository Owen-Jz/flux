'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlatformStats } from '@/actions/admin/analytics';
import { getAuditLogs } from '@/actions/admin';
import { UsersIcon, BuildingOffice2Icon, Squares2X2Icon, ArrowTrendingUpIcon, BoltIcon, CircleStackIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
    label: string;
    value: number;
    change?: string;
    changePositive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    index: number;
}

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
}

function StatCard({ label, value, change, changePositive, icon: Icon, color, index }: StatCardProps) {
    const colorClasses: Record<string, { bg: string; icon: string; glow: string }> = {
        blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', glow: 'shadow-blue-500/20' },
        purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', glow: 'shadow-purple-500/20' },
        green: { bg: 'bg-green-500/10', icon: 'text-green-400', glow: 'shadow-green-500/20' },
        orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', glow: 'shadow-orange-500/20' },
    };

    const styles = colorClasses[color] || colorClasses.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${styles.bg}`}>
                        <Icon className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    {change && (
                        <span className={`text-xs font-medium ${changePositive ? 'text-green-400' : 'text-red-400'}`}>
                            {change}
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-zinc-50 mb-1">
                    <AnimatedCounter value={value} />
                </p>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>

            {/* Accent line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any>({ logs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, activityData] = await Promise.all([
                    getPlatformStats(),
                    getAuditLogs({ limit: 10 }),
                ]);
                setStats(statsData);
                setRecentActivity(activityData);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const statCards = stats ? [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            change: stats.userGrowth >= 0 ? `+${stats.userGrowth}%` : `${stats.userGrowth}%`,
            changePositive: stats.userGrowth >= 0,
            icon: UsersIcon,
            color: 'blue',
        },
        {
            label: 'Total Workspaces',
            value: stats.totalWorkspaces,
            change: `+${stats.newWorkspacesThisMonth} this month`,
            changePositive: true,
            icon: BuildingOffice2Icon,
            color: 'purple',
        },
        {
            label: 'Total Boards',
            value: stats.totalBoards,
            icon: Squares2X2Icon,
            color: 'green',
        },
        {
            label: 'Total Tasks',
            value: stats.totalTasks,
            icon: CircleStackIcon,
            color: 'orange',
        },
    ] : [];

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
                <p className="text-zinc-500">Platform overview and insights</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <StatCard key={stat.label} {...stat} index={index} />
                ))}
            </div>

            {/* Plan Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 relative overflow-hidden"
            >
                {/* Subtle glow accent */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />

                <div className="relative">
                    <h2 className="text-lg font-semibold text-zinc-50 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        User Plans
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats && Object.entries(stats.plans).map(([plan, count], index) => (
                            <motion.div
                                key={plan}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="text-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                <p className="text-2xl font-bold text-zinc-50">{count as number}</p>
                                <p className="text-sm text-zinc-500 capitalize">{plan}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
            >
                {/* Subtle glow accent */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <BoltIcon className="w-5 h-5 text-violet-400" />
                        <h2 className="text-lg font-semibold text-zinc-50">Recent Admin Activity</h2>
                    </div>

                    <div className="space-y-3">
                        {recentActivity.logs.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <BoltIcon className="w-6 h-6 text-zinc-600" />
                                </div>
                                <p className="text-zinc-500 text-sm">No recent activity</p>
                            </div>
                        ) : (
                            recentActivity.logs.map((log: any, index: number) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + index * 0.05 }}
                                    className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                                >
                                    {/* Activity dot */}
                                    <div className="relative">
                                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-500 animate-ping opacity-50" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50 transition-colors">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            Target: {log.targetType} • {formatTimeAgo(new Date(log.createdAt))}
                                        </p>
                                    </div>

                                    {/* Time badge */}
                                    <span className="text-xs text-zinc-600">
                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}