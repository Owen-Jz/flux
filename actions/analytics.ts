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
