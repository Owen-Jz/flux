
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, TrendingUp, Users } from "lucide-react";

export const HeroAnimation = () => {
    return (
        <div className="relative w-full h-[500px] md:h-[700px] flex items-center justify-center overflow-visible perspective-2000">
            {/* Background Window (Left - Project Settings) */}
            <motion.div
                initial={{ opacity: 0, x: -100, z: -100, rotateY: 10 }}
                animate={{ opacity: 0.4, x: -50, z: -50, rotateY: 5 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="absolute left-0 md:left-[10%] top-[20%] w-[300px] md:w-[500px] h-[400px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden pointer-events-none z-0 hidden md:block"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="h-10 border-b border-gray-100 bg-gray-50 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <div className="ml-2 w-20 h-2 bg-gray-200 rounded-full" />
                </div>
                <div className="p-6 space-y-4">
                    <div className="w-1/3 h-4 bg-gray-100 rounded" />
                    <div className="w-full h-8 bg-gray-50 border border-gray-100 rounded" />
                    <div className="w-full h-8 bg-gray-50 border border-gray-100 rounded" />
                    <div className="w-2/3 h-4 bg-gray-100 rounded mt-4" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-gray-50 rounded border border-gray-100" />
                        <div className="h-24 bg-gray-50 rounded border border-gray-100" />
                    </div>
                </div>
            </motion.div>

            {/* Background Window (Right - Team Stats) */}
            <motion.div
                initial={{ opacity: 0, x: 100, z: -100, rotateY: -10 }}
                animate={{ opacity: 0.4, x: 50, z: -50, rotateY: -5 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="absolute right-0 md:right-[5%] top-[10%] w-[280px] md:w-[400px] h-[500px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden pointer-events-none z-0 hidden md:block"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="h-10 border-b border-gray-100 bg-gray-50 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <div className="ml-auto w-4 h-4 rounded text-gray-400">
                        <div className="w-full h-0.5 bg-current mb-0.5" />
                        <div className="w-full h-0.5 bg-current mb-0.5" />
                        <div className="w-full h-0.5 bg-current" />
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-gray-50">
                            <div className="w-8 h-8 rounded-full bg-gray-100" />
                            <div className="flex-1 space-y-1">
                                <div className="w-16 h-2 bg-gray-100 rounded" />
                                <div className="w-10 h-1.5 bg-gray-50 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Main Dashboard Container - Front & Center */}
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="relative z-20 w-[340px] md:w-[800px] bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-200/80 backdrop-blur-xl"
            >
                {/* Header */}
                <div className="h-14 border-b border-gray-100/80 flex items-center px-6 gap-4 bg-white/50 rounded-t-xl backdrop-blur-md">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]/50" />
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-2" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 rounded-md text-xs font-medium text-gray-500 border border-gray-200/50">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Flux Board / Product Launch
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 md:p-8 bg-gradient-to-b from-gray-50/50 to-white min-h-[450px] rounded-b-xl relative overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                        {/* Sidebar */}
                        <div className="w-48 hidden md:block space-y-6">
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Favorites</div>
                                <div className="h-8 w-full bg-indigo-50/50 text-indigo-600 rounded-md flex items-center px-3 text-sm border border-indigo-100/50">
                                    <span className="mr-2">🚀</span> Launch
                                </div>
                                <div className="h-8 w-full hover:bg-gray-50 rounded-md flex items-center px-3 text-sm text-gray-500 transition-colors">
                                    <span className="mr-2">🐛</span> Bugs
                                </div>
                                <div className="h-8 w-full hover:bg-gray-50 rounded-md flex items-center px-3 text-sm text-gray-500 transition-colors">
                                    <span className="mr-2">🎨</span> Design
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team</div>
                                <div className="flex -space-x-2 px-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 shadow-sm" />
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 shadow-sm">+3</div>
                                </div>
                            </div>
                        </div>

                        {/* Main Board */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-bold text-gray-800">Q3 Roadmap</div>
                                <div className="flex gap-2">
                                    <div className="h-8 px-3 rounded-md bg-white border border-gray-200 text-sm flex items-center text-gray-500 shadow-sm">Filter</div>
                                    <div className="h-8 px-3 rounded-md bg-black text-white text-sm flex items-center shadow-lg shadow-gray-500/20">New Task</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Column 1 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                                        <span>To Do</span>
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">4</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div className="h-1.5 w-8 bg-orange-200 rounded-full mb-2" />
                                        <div className="text-sm font-medium text-gray-700 mb-2">Research Competitors</div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-6 h-6 rounded-full bg-gray-100" />
                                            <div className="text-[10px] text-gray-400">Oct 24</div>
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div className="h-1.5 w-8 bg-blue-200 rounded-full mb-2" />
                                        <div className="text-sm font-medium text-gray-700 mb-2">Draft Spec</div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-6 h-6 rounded-full bg-gray-100" />
                                            <div className="text-[10px] text-gray-400">Oct 25</div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                                        <span>In Progress</span>
                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">2</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm ring-1 ring-blue-500/10">
                                        <div className="h-1.5 w-8 bg-purple-200 rounded-full mb-2" />
                                        <div className="text-sm font-medium text-gray-700 mb-2">Homepage Design</div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-blue-500 h-full w-2/3" />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Column 3 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                                        <span>Done</span>
                                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">8</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm opacity-80">
                                        <div className="h-1.5 w-8 bg-green-200 rounded-full mb-2" />
                                        <div className="text-sm font-medium text-gray-500 line-through mb-2">User Interviews</div>
                                        <div className="flex items-center justify-end">
                                            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px]">✓</div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Elements (Badges/Toasts) */}
                <motion.div
                    initial={{ x: 50, y: 20, opacity: 0 }}
                    animate={{ x: -30, y: -20, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute -right-8 top-32 bg-white p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 z-30"
                >
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <CheckCircle2 size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-800">Deployed to Prod</div>
                        <div className="text-[10px] text-gray-400">Just now</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: -50, y: 50, opacity: 0 }}
                    animate={{ x: 30, y: -40, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="absolute -left-10 bottom-24 bg-white p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 z-30"
                >
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">JD</div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-[3px] border-white rounded-full" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-800">Sarah commented</div>
                        <div className="text-[10px] text-gray-500">"Looks fantastic! 🚀"</div>
                    </div>
                </motion.div>

                {/* 3D Floating Cursor */}
                <motion.div
                    animate={{
                        x: [250, 320, 250],
                        y: [200, 130, 200],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 z-40 pointer-events-none drop-shadow-xl"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black drop-shadow-sm">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z" fill="currentColor" stroke="white" strokeWidth="2" />
                    </svg>
                    <div className="ml-4 -mt-2 bg-[#F36] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        You
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
