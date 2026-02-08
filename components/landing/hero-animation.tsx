
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, TrendingUp, Users } from "lucide-react";

export const HeroAnimation = () => {
    return (
        <div className="relative w-full h-[500px] md:h-[700px] flex items-center justify-center overflow-hidden perspective-2000">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--brand-primary)] rounded-full blur-[150px] opacity-10 animate-pulse" />

            {/* Main Dashboard Container - Tilted 3D */}
            <motion.div
                initial={{ rotateX: 20, rotateY: -10, scale: 0.9, opacity: 0 }}
                animate={{ rotateX: 5, rotateY: -5, scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative z-10 w-[320px] md:w-[650px] bg-white rounded-xl shadow-2xl border border-white/50 backdrop-blur-sm"
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-white/10 to-transparent rounded-xl pointer-events-none z-50" />

                {/* Header */}
                <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-3 bg-white/80 rounded-t-xl">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="h-2 w-24 bg-gray-100 rounded-full ml-2" />
                </div>

                {/* Dashboard Content */}
                <div className="p-6 grid grid-cols-12 gap-4 bg-gray-50/50 min-h-[350px] rounded-b-xl">
                    {/* Sidebar */}
                    <div className="col-span-3 space-y-3 hidden md:block">
                        <div className="h-2 w-16 bg-gray-200 rounded mb-4" />
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-8 w-full bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 md:col-span-9 space-y-4">
                        {/* Stats Row */}
                        <div className="flex gap-4 mb-2">
                            <div className="flex-1 h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-3 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp size={32} />
                                </div>
                                <div className="h-2 w-12 bg-gray-100 rounded mb-2" />
                                <div className="h-6 w-20 bg-indigo-100/50 rounded" />
                            </div>
                            <div className="flex-1 h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Users size={32} />
                                </div>
                                <div className="h-2 w-12 bg-gray-100 rounded mb-2" />
                                <div className="h-6 w-20 bg-emerald-100/50 rounded" />
                            </div>
                        </div>

                        {/* Kanban Columns */}
                        <div className="grid grid-cols-3 gap-3 h-[200px]">
                            {[0, 1, 2].map((col) => (
                                <div key={col} className="bg-gray-100/50 rounded-lg p-2 flex flex-col gap-2">
                                    <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                                    {[1, 2].map((card) => (
                                        <motion.div
                                            key={card}
                                            whileHover={{ y: -2 }}
                                            className="bg-white p-2 rounded shadow-sm border border-gray-200/60 text-[10px]"
                                        >
                                            <div className="h-1.5 w-full bg-gray-100 rounded mb-2" />
                                            <div className="h-1.5 w-2/3 bg-gray-100 rounded" />
                                        </motion.div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Floating Elements (Badges/Toasts) */}
                <motion.div
                    initial={{ x: 50, y: 20, opacity: 0 }}
                    animate={{ x: -20, y: -20, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute -right-12 top-20 bg-white p-3 rounded-lg shadow-xl border border-gray-100 flex items-center gap-3 z-20"
                >
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <CheckCircle2 size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-800">Task Completed</div>
                        <div className="text-[10px] text-gray-400">Just now</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: -50, y: 50, opacity: 0 }}
                    animate={{ x: 20, y: -40, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="absolute -left-8 bottom-32 bg-white p-3 rounded-lg shadow-xl border border-gray-100 flex items-center gap-3 z-20"
                >
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">JD</div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-800">New Comment</div>
                        <div className="text-[10px] text-gray-400">"Great work team!"</div>
                    </div>
                </motion.div>

                {/* 3D Floating Cursor */}
                <motion.div
                    animate={{
                        x: [180, 250, 180],
                        y: [150, 80, 150],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 z-30 pointer-events-none drop-shadow-lg"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z" fill="currentColor" stroke="white" strokeWidth="2" />
                    </svg>
                    <div className="ml-4 -mt-2 bg-[var(--brand-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        Owen
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
