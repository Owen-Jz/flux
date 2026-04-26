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
                className="md:col-span-6 lg:col-span-8 group relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-[var(--text-primary)]" aria-hidden="true">
                    <UsersIcon className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-6">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">See your team working live</h3>
                    <p className="text-[var(--text-secondary)] max-w-lg leading-relaxed text-lg">
                        Watch who's on what, in real-time. No more stepping on each other's toes or doing double work.
                    </p>
                </div>
                <div className="mt-8 flex gap-2">
                    <div className="h-2 w-24 bg-[var(--background-subtle)] rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-[var(--brand-primary)]" />
                    </div>
                </div>
            </motion.div>

            {/* Feature - Speed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-10 transition-opacity" aria-hidden="true" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 text-[var(--text-inverse)] flex items-center justify-center mb-6">
                            <BoltIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-[var(--text-inverse)]">Speed that disappears</h3>
                        <p className="text-[var(--text-inverse)] opacity-70 leading-relaxed">
                            Fast enough that you forget it's there. Every click, instant. Every update, immediate.
                        </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold font-mono text-white">0</div>
                            <div className="text-xs text-white/60 uppercase tracking-widest font-bold">Second load times</div>
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
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-4 md:mb-6">
                    <TableCellsIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-[var(--text-primary)]">Rules That Work for You</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Set up simple automations. When something changes, things move where they need to go—automatically.
                </p>
            </motion.div>

            {/* Feature - Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                        <LockClosedIcon className="w-6 h-6" />
                    </div>
                    <div className="px-2 py-1 rounded-md bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[10px] font-bold uppercase">SOC2</div>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-[var(--text-primary)]">Security Without the Headache</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Your data is encrypted and protected. You control who sees what—down to the smallest detail.
                </p>
            </motion.div>

            {/* Feature - Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-5 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-4 md:mb-6">
                    <ChartBarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-[var(--text-primary)]">See Where You're Stuck</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Beautiful charts that show you exactly where work is piling up—and how to fix it.
                </p>
            </motion.div>
        </div>
    );
}
