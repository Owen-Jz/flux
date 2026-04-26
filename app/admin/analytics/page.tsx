'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlatformStats, getUserGrowthData, getWorkspaceGrowthData, getTaskStats, getTopWorkspaces } from '@/actions/admin/analytics';
import { UsersIcon, BuildingOffice2Icon, Squares2X2Icon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

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

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            {/* Subtle glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
                <h2 className="text-lg font-semibold text-zinc-50 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    {title}
                </h2>
                {children}
            </div>
        </motion.div>
    );
}

function StatCard({ label, value, change, icon: Icon, color, index }: { label: string; value: number; change?: string; icon: React.ComponentType<{ className?: string }>; color: string; index: number }) {
    const colorClasses: Record<string, { bg: string; icon: string }> = {
        blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400' },
        purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400' },
        green: { bg: 'bg-green-500/10', icon: 'text-green-400' },
        orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400' },
    };

    const styles = colorClasses[color] || colorClasses.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${styles.bg}`}>
                        <Icon className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    {change && (
                        <span className="text-xs font-medium text-green-400">{change}</span>
                    )}
                </div>
                <p className="text-3xl font-bold text-zinc-50 mb-1">
                    <AnimatedCounter value={value} />
                </p>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>
        </motion.div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-zinc-500 text-sm">Loading analytics...</span>
            </div>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [userGrowth, setUserGrowth] = useState<any[]>([]);
    const [workspaceGrowth, setWorkspaceGrowth] = useState<any[]>([]);
    const [taskStats, setTaskStats] = useState<any>(null);
    const [topWorkspaces, setTopWorkspaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, userGrowthData, workspaceGrowthData, taskStatsData, topWorkspacesData] = await Promise.all([
                    getPlatformStats(),
                    getUserGrowthData(30),
                    getWorkspaceGrowthData(30),
                    getTaskStats(),
                    getTopWorkspaces(10),
                ]);
                setStats(statsData);
                setUserGrowth(userGrowthData);
                setWorkspaceGrowth(workspaceGrowthData);
                setTaskStats(taskStatsData);
                setTopWorkspaces(topWorkspacesData);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-zinc-50">Analytics</h1>
                    <p className="text-zinc-500">Platform performance and insights</p>
                </motion.div>
                <LoadingSpinner />
            </div>
        );
    }

    // Prepare pie chart data for plan distribution
    const pieData = stats ? Object.entries(stats.plans).map(([name, value]: [string, any]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
    })) : [];

    // Prepare task status data
    const taskStatusData = taskStats ? Object.entries(taskStats.byStatus).map(([name, value]: [string, any]) => ({
        name: name.replace('_', ' '),
        value,
    })) : [];

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, change: `+${stats?.newUsersThisMonth || 0} this month`, icon: UsersIcon, color: 'blue' },
        { label: 'Workspaces', value: stats?.totalWorkspaces || 0, change: `+${stats?.newWorkspacesThisMonth || 0} this month`, icon: BuildingOffice2Icon, color: 'purple' },
        { label: 'Total Tasks', value: stats?.totalTasks || 0, change: `${taskStats?.createdThisWeek || 0} this week`, icon: Squares2X2Icon, color: 'green' },
        { label: 'User Growth', value: stats?.userGrowth || 0, change: 'vs last month', icon: ArrowTrendingUpIcon, color: 'orange' },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Analytics</h1>
                <p className="text-zinc-500">Platform performance and insights</p>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <StatCard key={stat.label} {...stat} index={index} />
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <ChartCard title="User Growth (30 days)" delay={0.2}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={userGrowth}>
                                <defs>
                                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#a1a1aa' }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#userGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Workspace Growth Chart */}
                <ChartCard title="Workspace Growth (30 days)" delay={0.3}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={workspaceGrowth}>
                                <defs>
                                    <linearGradient id="workspaceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#a1a1aa' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="workspaces"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#workspaceGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Plan Distribution */}
                <ChartCard title="User Plan Distribution" delay={0.4}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#a1a1aa' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm text-zinc-400">{entry.name}: {entry.value}</span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Tasks by Status */}
                <ChartCard title="Tasks by Status" delay={0.5}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#71717a"
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#a1a1aa' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Top Workspaces */}
            <ChartCard title="Top Workspaces by Tasks" delay={0.6}>
                <div className="space-y-3">
                    {topWorkspaces.map((workspace, index) => (
                        <motion.div
                            key={workspace.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                        >
                            <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-zinc-500 group-hover:text-zinc-300">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-zinc-200 group-hover:text-zinc-50 transition-colors truncate">{workspace.name}</p>
                                <p className="text-sm text-zinc-500">/{workspace.slug}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-zinc-50">{workspace.taskCount}</p>
                                <p className="text-xs text-zinc-500">tasks</p>
                            </div>
                        </motion.div>
                    ))}
                    {topWorkspaces.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 text-sm">No workspace data available</p>
                        </div>
                    )}
                </div>
            </ChartCard>
        </div>
    );
}