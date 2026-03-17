"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
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
import { ArrowTrendingUpIcon, UsersIcon, CheckCircleIcon, BoltIcon } from "@heroicons/react/24/outline";

// Task completion trend data
const taskTrendData = [
  { day: "Mon", completed: 45, planned: 50 },
  { day: "Tue", completed: 52, planned: 55 },
  { day: "Wed", completed: 38, planned: 45 },
  { day: "Thu", completed: 65, planned: 60 },
  { day: "Fri", completed: 78, planned: 70 },
  { day: "Sat", completed: 32, planned: 30 },
  { day: "Sun", completed: 25, planned: 25 },
];

// Team velocity data
const velocityData = [
  { week: "W1", points: 120 },
  { week: "W2", points: 145 },
  { week: "W3", points: 132 },
  { week: "W4", points: 168 },
  { week: "W5", points: 185 },
  { week: "W6", points: 172 },
];

// Task distribution data
const distributionData = [
  { name: "Completed", value: 234, color: "#10b981" },
  { name: "In Progress", value: 56, color: "#3b82f6" },
  { name: "To Do", value: 89, color: "#f59e0b" },
  { name: "Blocked", value: 12, color: "#ef4444" },
];

// Activity feed data
const activityData = [
  { user: "Sarah K.", action: "completed", task: "Design system audit", time: "2m ago" },
  { user: "Mike R.", action: "commented on", task: "API integration", time: "5m ago" },
  { user: "Lisa M.", action: "moved", task: "User auth flow", time: "12m ago" },
  { user: "John D.", action: "created", task: "Performance optimization", time: "18m ago" },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export function AnalyticsDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={containerRef}
      className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 relative overflow-hidden"
      aria-labelledby="analytics-heading"
    >
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-200/20 dark:bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200/20 dark:bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div style={{ y }} className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-200 dark:border-blue-500/30 text-purple-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Analytics Dashboard
          </motion.span>
          <motion.h2
            id="analytics-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
          >
            Powerful insights for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 dark:from-blue-400 to-blue-600 dark:to-purple-400">
              {" "}data-driven teams
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Track progress, visualize team velocity, and make smarter decisions with beautiful built-in analytics.
          </motion.p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Task Completion Trend */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 dark:bg-blue-500/20 rounded-lg">
                <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Completion Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} className="fill-slate-500" />
                  <YAxis stroke="#64748b" fontSize={12} className="fill-slate-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#1e293b",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#10b981" }}
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
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                <BoltIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Velocity</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={12} className="fill-slate-500" />
                  <YAxis stroke="#64748b" fontSize={12} className="fill-slate-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#1e293b",
                    }}
                  />
                  <Bar
                    dataKey="points"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    activeBar={{ fill: "#60a5fa" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Task Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Distribution</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#1e293b",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#64748b", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
                <UsersIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Activity</h3>
              <span className="ml-auto flex items-center gap-2 text-xs text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-4">
              {activityData.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {activity.user.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">{activity.user}</span>{" "}
                      {activity.action}{" "}
                      <span className="text-purple-600 dark:text-blue-400">{activity.task}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
