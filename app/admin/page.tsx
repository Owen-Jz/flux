import { getPlatformStats, getRecentActivity } from '@/actions/admin/analytics';
import { getAuditLogs } from '@/actions/admin';
import { UsersIcon, BuildingOffice2Icon, Squares2X2Icon, ArrowTrendingUpIcon, BoltIcon } from '@heroicons/react/24/outline';

export default async function AdminDashboardPage() {
    const [stats, recentActivity] = await Promise.all([
        getPlatformStats(),
        getAuditLogs({ limit: 10 }),
    ]);

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            change: stats.userGrowth >= 0 ? `+${stats.userGrowth}%` : `${stats.userGrowth}%`,
            changePositive: stats.userGrowth >= 0,
            icon: UsersIcon,
            color: 'blue',
        },
        {
            label: 'Total Workspaces',
            value: stats.totalWorkspaces.toLocaleString(),
            change: `+${stats.newWorkspacesThisMonth} this month`,
            changePositive: true,
            icon: BuildingOffice2Icon,
            color: 'purple',
        },
        {
            label: 'Total Boards',
            value: stats.totalBoards.toLocaleString(),
            icon: Squares2X2Icon,
            color: 'green',
        },
        {
            label: 'Total Tasks',
            value: stats.totalTasks.toLocaleString(),
            icon: Squares2X2Icon,
            color: 'orange',
        },
    ];

    const colorStyles: Record<string, { bg: string; text: string; icon: string }> = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400', icon: 'bg-blue-100 dark:bg-blue-900' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400', icon: 'bg-purple-100 dark:bg-purple-900' },
        green: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600 dark:text-green-400', icon: 'bg-green-100 dark:bg-green-900' },
        orange: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400', icon: 'bg-orange-100 dark:bg-orange-900' },
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                <p className="text-[var(--text-secondary)]">Welcome to the Flux admin platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colorStyles[stat.color].icon}`}>
                                <stat.icon className={`w-6 h-6 ${colorStyles[stat.color].text}`} />
                            </div>
                            {stat.change && (
                                <span className={`text-xs font-medium ${stat.changePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{stat.value}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Plan Distribution */}
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-sm mb-8">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">User Plans</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.plans).map(([plan, count]) => (
                        <div key={plan} className="text-center p-4 bg-[var(--background-subtle)] rounded-xl">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{count}</p>
                            <p className="text-sm text-[var(--text-tertiary)] capitalize">{plan}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <BoltIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Admin Activity</h2>
                </div>
                <div className="space-y-3">
                    {recentActivity.logs.length === 0 ? (
                        <p className="text-[var(--text-tertiary)] text-sm">No recent activity</p>
                    ) : (
                        recentActivity.logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center gap-4 p-3 bg-[var(--background-subtle)] rounded-xl"
                            >
                                <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        Target: {log.targetType} • {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
