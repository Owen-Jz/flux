# Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an analytics dashboard section to the workspace page that displays real metrics from the user's workspace data, including task completion trends, team velocity, task distribution, and recent activity.

**Architecture:** Create server actions to fetch analytics data from MongoDB, then build a client component to display interactive charts using Recharts. The analytics section will be added to the workspace home page (`app/[slug]/page.tsx`).

**Tech Stack:** Next.js, Recharts, MongoDB/Mongoose, Framer Motion

---

## File Structure

```
actions/analytics.ts              # New - Server actions to fetch analytics data
components/analytics/            # New - Analytics components
  ├── analytics-section.tsx      # Main analytics container
  ├── task-trend-chart.tsx       # Task completion trend line chart
  ├── velocity-chart.tsx         # Team velocity bar chart
  ├── task-distribution.tsx      # Task status pie chart
  └── recent-activity.tsx        # Recent activity feed
app/[slug]/page.tsx              # Modify - Add analytics section to workspace
```

---

## Chunk 1: Server Actions for Analytics Data

### Task 1: Create analytics server actions

**Files:**
- Create: `actions/analytics.ts`

- [ ] **Step 1: Create analytics server actions**

```typescript
"use server";

import { Task } from "@/models/Task";
import { ActivityLog } from "@/models/ActivityLog";
import { Board } from "@/models/Board";
import mongoose from "mongoose";

export interface TaskTrendData {
    day: string;
    completed: number;
    planned: number;
}

export interface VelocityData {
    week: string;
    points: number;
}

export interface DistributionData {
    name: string;
    value: number;
    color: string;
}

export interface ActivityItem {
    userId: string;
    userName: string;
    type: string;
    taskTitle: string;
    time: string;
}

export interface WorkspaceAnalytics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    totalBoards: number;
    taskTrend: TaskTrendData[];
    velocity: VelocityData[];
    distribution: DistributionData[];
    recentActivity: ActivityItem[];
}

function getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export async function getWorkspaceAnalytics(workspaceId: string): Promise<WorkspaceAnalytics> {
    const objectId = new mongoose.Types.ObjectId(workspaceId);

    // Get all boards in workspace
    const boards = await Board.find({ workspaceId: objectId }).select("_id").lean();
    const boardIds = boards.map(b => b._id);

    if (boardIds.length === 0) {
        return {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            todoTasks: 0,
            totalBoards: 0,
            taskTrend: [],
            velocity: [],
            distribution: [],
            recentActivity: []
        };
    }

    // Task counts by status
    const taskStats = await Task.aggregate([
        { $match: { boardId: { $in: boardIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusCounts: Record<string, number> = {
        "BACKLOG": 0,
        "TODO": 0,
        "IN_PROGRESS": 0,
        "REVIEW": 0,
        "DONE": 0,
        "ARCHIVED": 0
    };

    taskStats.forEach(stat => {
        statusCounts[stat._id] = stat.count;
    });

    const completedTasks = statusCounts["DONE"] || 0;
    const inProgressTasks = (statusCounts["IN_PROGRESS"] || 0) + (statusCounts["REVIEW"] || 0);
    const todoTasks = (statusCounts["TODO"] || 0) + (statusCounts["BACKLOG"] || 0);

    // Task trend - last 7 days
    const now = new Date();
    const taskTrend: TaskTrendData[] = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const completed = await Task.countDocuments({
            boardId: { $in: boardIds },
            status: "DONE",
            updatedAt: { $gte: date, $lt: nextDate }
        });

        const created = await Task.countDocuments({
            boardId: { $in: boardIds },
            createdAt: { $gte: date, $lt: nextDate }
        });

        taskTrend.push({
            day: days[date.getDay()],
            completed,
            planned: created
        });
    }

    // Velocity - last 6 weeks
    const velocity: VelocityData[] = [];
    for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const completed = await Task.countDocuments({
            boardId: { $in: boardIds },
            status: "DONE",
            updatedAt: { $gte: weekStart, $lt: weekEnd }
        });

        velocity.push({
            week: getWeekNumber(weekStart),
            points: completed
        });
    }

    // Task distribution
    const distribution: DistributionData[] = [
        { name: "Completed", value: completedTasks, color: "#10b981" },
        { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
        { name: "To Do", value: todoTasks, color: "#f59e0b" }
    ];

    // Recent activity
    const recentLogs = await ActivityLog.find({ workspaceId: objectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name image")
        .lean();

    const recentActivity: ActivityItem[] = recentLogs.map(log => ({
        userId: log.userId.toString(),
        userName: (log.userId as unknown as { name: string }).name || "Unknown",
        type: log.type.replace("TASK_", "").toLowerCase(),
        taskTitle: log.metadata?.taskTitle || log.title,
        time: getTimeAgo(log.createdAt)
    }));

    return {
        totalTasks: completedTasks + inProgressTasks + todoTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalBoards: boards.length,
        taskTrend,
        velocity,
        distribution,
        recentActivity
    };
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/analytics.ts
git commit -m "feat: add workspace analytics server actions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Analytics Components

### Task 2: Create analytics section component

**Files:**
- Create: `components/analytics/analytics-section.tsx`

- [ ] **Step 1: Create analytics section component**

```typescript
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
import { TrendingUp, Activity, CheckCircle, Users } from "lucide-react";
import { WorkspaceAnalytics } from "@/actions/analytics";

interface AnalyticsSectionProps {
    analytics: WorkspaceAnalytics;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

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
            icon: CheckCircle,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-500/10",
            textColor: "text-green-600",
        },
        {
            label: "In Progress",
            value: analytics.inProgressTasks,
            icon: Activity,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-600",
        },
        {
            label: "To Do",
            value: analytics.todoTasks,
            icon: TrendingUp,
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
                    <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h2
                    id="analytics-heading"
                    className="text-xl font-bold text-[var(--foreground)]"
                >
                    Workspace Analytics
                </h2>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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
                            <TrendingUp className="w-5 h-5 text-purple-600" />
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
                            <Activity className="w-5 h-5 text-blue-600" />
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
                            <CheckCircle className="w-5 h-5 text-green-600" />
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
                            <Users className="w-5 h-5 text-amber-600" />
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
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/analytics-section.tsx
git commit -m "feat: add analytics section component with charts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Integrate Analytics into Workspace Page

### Task 3: Add analytics to workspace page

**Files:**
- Modify: `app/[slug]/page.tsx:1-119`

- [ ] **Step 1: Read current workspace page to confirm structure**

This step is already complete - we read the file earlier in context.

- [ ] **Step 2: Update workspace page to include analytics**

```typescript
// Add import at top
import { getWorkspaceAnalytics } from "@/actions/analytics";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
```

```typescript
// In the component function, add this after fetching boards:
// Fetch analytics data
const analytics = await getWorkspaceAnalytics(workspace._id.toString());
```

```tsx
// In the JSX, add after the boards grid section:
// Add AnalyticsSection before closing the main div

{analytics && <AnalyticsSection analytics={analytics} />}

</div>  // This closes the main div that wraps the content
```

- [ ] **Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: Navigate to a workspace, see analytics section with real data

- [ ] **Step 4: Commit**

```bash
git add app/[slug]/page.tsx
git commit -m "feat: add analytics dashboard to workspace page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Handle Empty States & Polish

### Task 4: Improve empty state handling

**Files:**
- Modify: `components/analytics/analytics-section.tsx`

- [ ] **Step 1: Add call-to-action for empty workspaces**

The current implementation returns `null` when there are no tasks. This is fine, but we should add a more helpful message encouraging users to create boards and tasks.

- [ ] **Step 2: Commit**

```bash
git add components/analytics/analytics-section.tsx
git commit -m "feat: improve analytics empty state handling

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Verification

- [ ] Navigate to a workspace with boards/tasks
- [ ] Verify analytics section appears with real data
- [ ] Verify charts render correctly
- [ ] Verify recent activity shows actual workspace activity
- [ ] Test empty workspace (should not show analytics section)
- [ ] Test dark mode if applicable
