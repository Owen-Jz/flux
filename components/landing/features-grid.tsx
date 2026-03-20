"use client";

import { motion } from "framer-motion";
import { BoltIcon, UsersIcon, GlobeAltIcon, TableCellsIcon, ChartBarIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const features = [
    {
        icon: BoltIcon,
        title: "Lightning Fast",
        description: "Optimistic updates ensure every interaction feels instant. No loading spinners, just speed.",
        color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    },
    {
        icon: UsersIcon,
        title: "Real-time Collaboration",
        description: "See who's viewing and editing in real-time. Work together on the same board without conflicts.",
        color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
        icon: GlobeAltIcon,
        title: "Public Sharing",
        description: "Share your roadmap or project status with the world via a simple public link.",
        color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    },
    {
        icon: TableCellsIcon,
        title: "Workflow Automation",
        description: "Automate repetitive tasks and keep your team aligned with smart rules.",
        color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    },
    {
        icon: ChartBarIcon,
        title: "Insightful Reporting",
        description: "Track progress with visual charts and actionable insights to improve team velocity.",
        color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
    },
    {
        icon: LockClosedIcon,
        title: "Enterprise Security",
        description: "Bank-grade security with role-based access control and data encryption.",
        color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    },
];

export const FeaturesGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Main Feature - Real-time */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-6 lg:col-span-8 group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-slate-900 dark:text-white" aria-hidden="true">
                    <UsersIcon className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Real-time presence & multi-player editing</h3>
                    <p className="text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed text-lg">
                        See who's working on what in real-time. Avatars, cursors, and live updates make your team feel closer than ever, even when remote.
                    </p>
                </div>
                <div className="mt-8 flex gap-2">
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-indigo-500" />
                    </div>
                </div>
            </motion.div>

            {/* Feature - Speed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-slate-950 p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-10 transition-opacity" aria-hidden="true" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center mb-6">
                            <BoltIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Blazing fast performance</h3>
                        <p className="text-white/70 leading-relaxed">
                            Under 50ms latency for every action. Flux is built for speed, keeping you in flow.
                        </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold font-mono text-white">50ms</div>
                            <div className="text-xs text-white/60 uppercase tracking-widest font-bold">Latency</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Feature - Automation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 md:mb-6">
                    <TableCellsIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-900 dark:text-white">Workflow Automation</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Set up custom triggers and actions. Automatically move cards based on status or assignee changes.
                </p>
            </motion.div>

            {/* Feature - Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <LockClosedIcon className="w-6 h-6" />
                    </div>
                    <div className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase">SOC2</div>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-900 dark:text-white">Enterprise Security</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Bank-grade encryption, SSO, and granular role-based access controls to keep your data safe.
                </p>
            </motion.div>

            {/* Feature - Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4 md:mb-6">
                    <ChartBarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-900 dark:text-white">Deep Insights</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    Visualize team velocity, burnback charts, and resource allocation with beautiful built-in charts.
                </p>
            </motion.div>
        </div>
    );
}
