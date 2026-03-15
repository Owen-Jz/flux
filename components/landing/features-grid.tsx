"use client";

import { motion } from "framer-motion";
import { Zap, Users, Globe, Layers, BarChart3, Lock } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Optimistic updates ensure every interaction feels instant. No loading spinners, just speed.",
        color: "bg-yellow-500/10 text-yellow-600 bg-yellow-500/20 text-yellow-400",
    },
    {
        icon: Users,
        title: "Real-time Collaboration",
        description: "See who's viewing and editing in real-time. Work together on the same board without conflicts.",
        color: "bg-blue-500/10 text-blue-600 bg-blue-500/20 text-blue-400",
    },
    {
        icon: Globe,
        title: "Public Sharing",
        description: "Share your roadmap or project status with the world via a simple public link.",
        color: "bg-green-500/10 text-green-600 bg-green-500/20 text-green-400",
    },
    {
        icon: Layers,
        title: "Workflow Automation",
        description: "Automate repetitive tasks and keep your team aligned with smart rules.",
        color: "bg-purple-500/10 text-purple-600 bg-purple-500/20 text-purple-400",
    },
    {
        icon: BarChart3,
        title: "Insightful Reporting",
        description: "Track progress with visual charts and actionable insights to improve team velocity.",
        color: "bg-pink-500/10 text-pink-600 bg-pink-500/20 text-pink-400",
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description: "Bank-grade security with role-based access control and data encryption.",
        color: "bg-orange-500/10 text-orange-600 bg-orange-500/20 text-orange-400",
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
                className="md:col-span-6 lg:col-span-8 group relative overflow-hidden rounded-2xl bg-white bg-slate-800 border border-slate-200 border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-slate-900 text-white" aria-hidden="true">
                    <Users size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 bg-indigo-900/50 text-indigo-600 text-indigo-400 flex items-center justify-center mb-6">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 text-white">Real-time presence & multi-player editing</h3>
                    <p className="text-slate-600 text-slate-300 max-w-lg leading-relaxed text-lg">
                        See who's working on what in real-time. Avatars, cursors, and live updates make your team feel closer than ever, even when remote.
                    </p>
                </div>
                <div className="mt-8 flex gap-2">
                    <div className="h-2 w-24 bg-slate-100 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-indigo-500 animate-pulse" />
                    </div>
                </div>
            </motion.div>

            {/* Feature - Speed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-slate-900 bg-slate-950 p-8 text-white shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-6">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Blazing fast performance</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Under 50ms latency for every action. Flux is built for speed, keeping you in flow.
                        </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold font-mono">50ms</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latency</div>
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
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-white bg-slate-800 border border-slate-200 border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-purple-100 bg-purple-900/50 text-purple-600 text-purple-400 flex items-center justify-center mb-6">
                    <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 text-white">Workflow Automation</h3>
                <p className="text-slate-600 text-slate-300 text-sm leading-relaxed">
                    Set up custom triggers and actions. Automatically move cards based on status or assignee changes.
                </p>
            </motion.div>

            {/* Feature - Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-3 lg:col-span-4 group rounded-2xl bg-white bg-slate-800 border border-slate-200 border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 bg-emerald-900/50 text-emerald-600 text-emerald-400 flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div className="px-2 py-1 rounded-md bg-emerald-100 bg-emerald-900/50 text-emerald-700 text-emerald-300 text-[10px] font-bold uppercase">SOC2 Type II</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 text-white">Enterprise Security</h3>
                <p className="text-slate-600 text-slate-300 text-sm leading-relaxed">
                    Bank-grade encryption, SSO, and granular role-based access controls to keep your data safe.
                </p>
            </motion.div>

            {/* Feature - Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="md:col-span-6 lg:col-span-4 group rounded-2xl bg-white bg-slate-800 border border-slate-200 border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-500"
            >
                <div className="w-12 h-12 rounded-xl bg-pink-100 bg-pink-900/50 text-pink-600 text-pink-400 flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 text-white">Deep Insights</h3>
                <p className="text-slate-600 text-slate-300 text-sm leading-relaxed">
                    Visualize team velocity, burnback charts, and resource allocation with beautiful built-in charts.
                </p>
            </motion.div>
        </div>
    );
}
