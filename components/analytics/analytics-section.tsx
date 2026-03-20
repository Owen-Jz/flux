"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { ArrowTrendingUpIcon, BoltIcon, CheckCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { WorkspaceAnalytics } from "@/actions/analytics";

interface AnalyticsSectionProps {
    analytics: WorkspaceAnalytics;
}

function AnimatedNumber({
    value,
    suffix = "",
}: {
    value: number;
    suffix?: string;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        const duration = 1500;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value]);

    return (
        <span ref={ref}>
            {count}
            {suffix}
        </span>
    );
}

export function AnalyticsSection({ analytics }: AnalyticsSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    if (analytics.totalTasks === 0) {
        return null;
    }

    const metrics = [
        {
            label: "Tasks Completed",
            value: analytics.completedTasks,
            icon: CheckCircleIcon,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-500/10",
            textColor: "text-green-600",
        },
        {
            label: "In Progress",
            value: analytics.inProgressTasks,
            icon: BoltIcon,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-600",
        },
        {
            label: "To Do",
            value: analytics.todoTasks,
            icon: ArrowTrendingUpIcon,
            color: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-600",
        },
    ];

    return (
        <section
            ref={containerRef}
            className="mt-12"
            aria-labelledby="analytics-heading"
        >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <UsersIcon className="w-5 h-5 text-purple-600" />
                </div>
                <h2
                    id="analytics-heading"
                    className="text-xl font-bold text-[var(--foreground)]"
                >
                    Workspace Analytics
                </h2>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}
                            >
                                <metric.icon className={`w-5 h-5 ${metric.textColor}`} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-[var(--foreground)]">
                                    {isInView && (
                                        <AnimatedNumber value={metric.value} />
                                    )}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">
                                    {metric.label}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Task Completion Trend */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            Task Completion Trend
                        </h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.taskTrend}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="planned"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Team Velocity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <BoltIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            Team Velocity
                        </h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.velocity}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar
                                    dataKey="points"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Task Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            Task Distribution
                        </h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {analytics.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <UsersIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            Recent Activity
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {analytics.recentActivity.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)]">No recent activity</p>
                        ) : (
                            analytics.recentActivity.map((activity, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        {activity.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--foreground)] truncate">
                                            <span className="font-semibold">{activity.userName}</span>{" "}
                                            {activity.type}{" "}
                                            <span className="text-purple-600">{activity.taskTitle}</span>
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {activity.time}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
