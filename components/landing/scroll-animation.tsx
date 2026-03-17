"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TableCellsIcon } from "@heroicons/react/24/outline";

export function LandingPageAnimation() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const scale = useTransform(scrollYProgress, [0, 1], [0.98, 1.02]);
    const rotate = useTransform(scrollYProgress, [0, 1], [-1, 1]);

    return (
        <section ref={ref} id="how-it-works" className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 overflow-hidden" aria-labelledby="how-it-works-heading">
            {/* Background elements */}
            <div className="absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center max-w-2xl mb-12 lg:mb-20">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                        How It Works
                    </span>
                    <h2 id="how-it-works-heading" className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Designed for the way you work
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        A workspace that balances power with simplicity. No configuration required, just focus on what matters.
                    </p>
                </div>

                <motion.div
                    style={{ scale, rotate }}
                    className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                    <div className="h-11 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center px-5 gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
                            <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                        </div>
                        <div className="flex-1 flex justify-center lg:pr-12">
                            <div className="h-6 w-full max-w-md bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 flex items-center px-3 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">flux.so/workspace/main</div>
                            </div>
                        </div>
                    </div>

                    {/* Application Mockup */}
                    <div className="aspect-[16/10] w-full bg-white dark:bg-slate-800 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-56 lg:w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 lg:p-6 hidden lg:flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-600 shadow-lg shadow-purple-600/20 flex items-center justify-center text-white">
                                    <TableCellsIcon className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-sm text-slate-800 dark:text-white tracking-tight">Acme Global</div>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { name: "Dashboard", active: true },
                                    { name: "Inbox", active: false },
                                    { name: "My Tasks", active: false },
                                    { name: "Goals", active: false }
                                ].map((item) => (
                                    <div
                                        key={item.name}
                                        className={`h-10 w-full rounded-lg flex items-center px-3 text-sm font-medium ${
                                            item.active
                                                ? "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-purple-600 dark:text-purple-400"
                                                : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                                        }`}
                                    >
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <header className="h-14 border-b border-slate-200 dark:border-slate-700 px-6 lg:px-8 flex items-center justify-between bg-white dark:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-slate-800 dark:text-white">Product Roadmap 2026</h3>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2" />
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-600" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-9 w-24 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm" />
                                    <div className="h-9 w-28 bg-purple-600 rounded-lg shadow-lg shadow-purple-600/20" />
                                </div>
                            </header>

                            <div className="flex-1 p-5 lg:p-8 bg-slate-50/30 dark:bg-slate-800/30 overflow-hidden">
                                <div className="flex gap-5 lg:gap-6 h-full overflow-x-auto pb-4">
                                    {[
                                        { label: "Research", count: 4, color: "bg-orange-400" },
                                        { label: "Design", count: 2, color: "bg-purple-400" },
                                        { label: "Development", count: 6, color: "bg-blue-400" }
                                    ].map((col, idx) => (
                                        <div key={idx} className="w-72 lg:w-80 flex-shrink-0 flex flex-col gap-3 lg:gap-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{col.label}</span>
                                                </div>
                                                <span className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-300">{col.count}</span>
                                            </div>
                                            {[1, 2].map(card => (
                                                <div key={card} className="bg-white dark:bg-slate-700/50 p-4 lg:p-5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                                                    <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-600 rounded mb-3" />
                                                    <div className="h-2 w-1/2 bg-slate-50 dark:bg-slate-700 rounded mb-4" />
                                                    <div className="flex justify-between items-center pt-2">
                                                        <div className="flex gap-1">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600" />
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600" />
                                                        </div>
                                                        <div className="h-4 w-12 bg-slate-50 dark:bg-slate-600 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
