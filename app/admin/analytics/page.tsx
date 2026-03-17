'use client';

import { useState, useEffect } from 'react';
import { getPlatformStats, getUserGrowthData, getWorkspaceGrowthData, getTaskStats, getTopWorkspaces } from '@/actions/admin/analytics';
import { UsersIcon, BuildingOffice2Icon, Squares2X2Icon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

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
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--text-secondary)]">Loading analytics...</div>
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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
                <p className="text-[var(--text-secondary)]">Platform performance and insights</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
                            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-[var(--text-tertiary)]">Total Users</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">+{stats?.newUsersThisMonth} this month</p>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900">
                            <BuildingOffice2Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-[var(--text-tertiary)]">Workspaces</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalWorkspaces.toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">+{stats?.newWorkspacesThisMonth} this month</p>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900">
                            <Squares2X2Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-[var(--text-tertiary)]">Total Tasks</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.totalTasks.toLocaleString()}</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">{taskStats?.createdThisWeek} this week</p>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm text-[var(--text-tertiary)]">User Growth</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{stats?.userGrowth >= 0 ? '+' : ''}{stats?.userGrowth}%</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">vs last month</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">User Growth (30 days)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={userGrowth}>
                                <defs>
                                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-tertiary)"
                                    fontSize={12}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#userGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Workspace Growth Chart */}
                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Workspace Growth (30 days)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={workspaceGrowth}>
                                <defs>
                                    <linearGradient id="workspaceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-tertiary)"
                                    fontSize={12}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="workspaces"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#workspaceGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Plan Distribution */}
                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">User Plan Distribution</h2>
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
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm text-[var(--text-secondary)]">{entry.name}: {entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tasks by Status */}
                <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Tasks by Status</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-tertiary)"
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Workspaces */}
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top Workspaces by Tasks</h2>
                <div className="space-y-3">
                    {topWorkspaces.map((workspace, index) => (
                        <div
                            key={workspace.id}
                            className="flex items-center gap-4 p-3 bg-[var(--background-subtle)] rounded-xl"
                        >
                            <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-[var(--text-tertiary)]">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text-primary)] truncate">{workspace.name}</p>
                                <p className="text-sm text-[var(--text-tertiary)]">/{workspace.slug}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[var(--text-primary)]">{workspace.taskCount}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">tasks</p>
                            </div>
                        </div>
                    ))}
                    {topWorkspaces.length === 0 && (
                        <p className="text-center text-[var(--text-tertiary)] py-8">No workspace data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
