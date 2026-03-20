"use client";

import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export const HeroAnimation = () => {
    return (
        <div className="relative w-full h-[400px] md:h-[600px] flex items-center justify-center overflow-visible perspective-2000">
            {/* Background Window (Left - Project Settings) */}
            <motion.div
                initial={{ opacity: 0, x: -100, z: -100, rotateY: 10 }}
                animate={{ opacity: 0.3, x: -50, z: -50, rotateY: 5 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="absolute left-0 md:left-[5%] top-[15%] w-[280px] md:w-[450px] h-[350px] bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-xl overflow-hidden pointer-events-none z-0 hidden md:block"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="h-10 border-b border-[var(--border-subtle)] bg-[var(--background-subtle)] flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
                    <div className="ml-2 w-20 h-2 bg-[var(--border-subtle)] rounded-full" />
                </div>
                <div className="p-5 space-y-4">
                    <div className="w-1/3 h-4 bg-[var(--background-subtle)] rounded" />
                    <div className="w-full h-8 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded" />
                    <div className="w-full h-8 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded" />
                    <div className="w-2/3 h-4 bg-[var(--background-subtle)] rounded mt-4" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-[var(--background-subtle)] rounded border border-[var(--border-subtle)]" />
                        <div className="h-20 bg-[var(--background-subtle)] rounded border border-[var(--border-subtle)]" />
                    </div>
                </div>
            </motion.div>

            {/* Background Window (Right - Team Stats) */}
            <motion.div
                initial={{ opacity: 0, x: 100, z: -100, rotateY: -10 }}
                animate={{ opacity: 0.3, x: 50, z: -50, rotateY: -5 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="absolute right-0 md:right-[5%] top-[5%] w-[250px] md:w-[380px] h-[450px] bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-xl overflow-hidden pointer-events-none z-0 hidden md:block"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="h-10 border-b border-[var(--border-subtle)] bg-[var(--background-subtle)] flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
                    <div className="ml-auto w-4 h-4 rounded text-[var(--text-tertiary)]">
                        <div className="w-full h-0.5 bg-current mb-0.5" />
                        <div className="w-full h-0.5 bg-current mb-0.5" />
                        <div className="w-full h-0.5 bg-current" />
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-[var(--border-subtle)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--background-subtle)]" />
                            <div className="flex-1 space-y-1">
                                <div className="w-16 h-2 bg-[var(--background-subtle)] rounded" />
                                <div className="w-10 h-1.5 bg-[var(--background-subtle)] rounded" />
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
                className="relative z-20 w-[320px] md:w-[700px] bg-[var(--surface)] rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-[var(--border-subtle)] backdrop-blur-xl"
            >
                {/* Header */}
                <div className="h-14 border-b border-[var(--border-subtle)] flex items-center px-5 gap-4 bg-[var(--surface)]/50 rounded-t-xl backdrop-blur-md">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--error-primary)]/80 border border-[var(--error-primary)]/50" />
                        <div className="w-3 h-3 rounded-full bg-[var(--warning-primary)]/80 border border-[var(--warning-primary)]/50" />
                        <div className="w-3 h-3 rounded-full bg-[var(--success-primary)]/80 border border-[var(--success-primary)]/50" />
                    </div>
                    <div className="h-6 w-px bg-[var(--border-subtle)] mx-2" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background-subtle)] rounded-md text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                        Flux Board / Product Launch
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-5 md:p-7 bg-gradient-to-b from-[var(--background-subtle)]/50 to-[var(--surface)] min-h-[380px] rounded-b-xl relative overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                        {/* Sidebar */}
                        <div className="w-44 hidden md:block space-y-5">
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Favorites</div>
                                <div className="h-8 w-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-md flex items-center px-3 text-sm border border-[var(--brand-primary)]/20">
                                    <span className="mr-2">🚀</span> Launch
                                </div>
                                <div className="h-8 w-full hover:bg-[var(--background-subtle)] rounded-md flex items-center px-3 text-sm text-[var(--text-secondary)] transition-colors">
                                    <span className="mr-2">🐛</span> Bugs
                                </div>
                                <div className="h-8 w-full hover:bg-[var(--background-subtle)] rounded-md flex items-center px-3 text-sm text-[var(--text-secondary)] transition-colors">
                                    <span className="mr-2">🎨</span> Design
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Team</div>
                                <div className="flex -space-x-2 px-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--background-subtle)] shadow-sm" />
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--background-subtle)] flex items-center justify-center text-xs text-[var(--text-tertiary)] shadow-sm">+3</div>
                                </div>
                            </div>
                        </div>

                        {/* Main Board */}
                        <div className="flex-1 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-[var(--text-primary)]">Q3 Roadmap</div>
                                <div className="flex gap-2">
                                    <div className="h-8 px-3 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)] text-sm flex items-center text-[var(--text-secondary)] shadow-sm">Filter</div>
                                    <div className="h-8 px-3 rounded-md bg-[var(--brand-primary)] text-[var(--text-inverse)] text-sm flex items-center shadow-lg shadow-[var(--brand-primary)]/20 font-medium">New Task</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Column 1 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                                        <span>To Do</span>
                                        <span className="bg-[var(--background-subtle)] px-1.5 py-0.5 rounded">4</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] shadow-sm">
                                        <div className="h-1.5 w-8 bg-[var(--warning-primary)] rounded-full mb-2 opacity-60" />
                                        <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">Research Competitors</div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)]" />
                                            <div className="text-[10px] text-[var(--text-tertiary)]">Oct 24</div>
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] shadow-sm">
                                        <div className="h-1.5 w-8 bg-[var(--brand-primary)] rounded-full mb-2 opacity-60" />
                                        <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">Draft Spec</div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)]" />
                                            <div className="text-[10px] text-[var(--text-tertiary)]">Oct 25</div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                                        <span>In Progress</span>
                                        <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-1.5 py-0.5 rounded">2</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--brand-primary)]/30 shadow-sm ring-1 ring-[var(--brand-primary)]/10">
                                        <div className="h-1.5 w-8 bg-[var(--brand-primary)] rounded-full mb-2 opacity-60" />
                                        <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">Homepage Design</div>
                                        <div className="w-full bg-[var(--background-subtle)] h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-[var(--brand-primary)] h-full w-2/3" />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Column 3 */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                                        <span>Done</span>
                                        <span className="bg-[var(--success-primary)]/10 text-[var(--success-primary)] px-1.5 py-0.5 rounded">8</span>
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} className="p-3 bg-[var(--background-subtle)] rounded-lg border border-[var(--border-subtle)] shadow-sm opacity-80">
                                        <div className="h-1.5 w-8 bg-[var(--success-primary)] rounded-full mb-2 opacity-60" />
                                        <div className="text-sm font-medium text-[var(--text-tertiary)] line-through mb-2">User Interviews</div>
                                        <div className="flex items-center justify-end">
                                            <div className="w-4 h-4 rounded-full bg-[var(--success-primary)]/10 flex items-center justify-center text-[var(--success-primary)] text-[10px]">✓</div>
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
                    animate={{ x: -20, y: -15, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute -right-6 top-28 bg-[var(--surface)] p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-subtle)] flex items-center gap-3 z-30"
                >
                    <div className="p-2 bg-[var(--success-primary)]/10 rounded-full text-[var(--success-primary)]">
                        <CheckCircleIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">Deployed to Prod</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Just now</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: -50, y: 50, opacity: 0 }}
                    animate={{ x: 20, y: -30, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="absolute -left-8 bottom-20 bg-[var(--surface)] p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border-subtle)] flex items-center gap-3 z-30"
                >
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--info-primary)] to-[var(--brand-primary)] flex items-center justify-center text-[var(--text-inverse)] font-bold text-xs">JD</div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[var(--success-primary)] border-[3px] border-[var(--surface)] rounded-full" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">Sarah commented</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">"Looks fantastic! 🚀"</div>
                    </div>
                </motion.div>

                {/* 3D Floating Cursor */}
                <motion.div
                    animate={{
                        x: [200, 280, 200],
                        y: [150, 80, 150],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 z-40 pointer-events-none drop-shadow-xl"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--text-primary)] drop-shadow-sm">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z" fill="currentColor" stroke="var(--text-inverse)" strokeWidth="2" />
                    </svg>
                    <div className="ml-4 -mt-2 bg-[var(--brand-primary)] text-[var(--text-inverse)] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        You
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
