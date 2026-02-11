
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Layers } from "lucide-react";


export function LandingPageAnimation() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1.05]);
    const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

    return (
        <section ref={ref} className="relative py-32 px-6 overflow-hidden bg-white">
            {/* Background elements for ambiance */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 -z-10" />
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-100 rounded-full blur-[120px] opacity-30 -z-10" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-100 rounded-full blur-[120px] opacity-30 -z-10" />

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center max-w-2xl mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-6">Designed for the way you work</h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                        A workspace that balances power with simplicity. No configuration required, just focus on what matters.
                    </p>
                </div>

                <motion.div
                    style={{ scale, rotate }}
                    className="relative w-full rounded-[var(--radius-xl)] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-[var(--border-subtle)] bg-white perspective-2000"
                >
                    {/* Noise texture overlay */}
                    <div className="noise opacity-[0.02]" />

                    <div className="h-12 border-b border-[var(--border-subtle)] bg-slate-50 flex items-center px-6 gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
                            <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                        </div>
                        <div className="flex-1 flex justify-center lg:pr-12">
                            <div className="h-6 w-full max-w-md bg-white rounded-md border border-[var(--border-subtle)] flex items-center px-3 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                <div className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-widest">flux.so/workspace/main</div>
                            </div>
                        </div>
                    </div>

                    {/* Application Mockup */}
                    <div className="aspect-[16/9] w-full bg-white flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-64 border-r border-[var(--border-subtle)] bg-slate-50/50 p-6 hidden lg:flex flex-col gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 flex items-center justify-center text-white">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-sm tracking-tight">Acme Global</div>
                            </div>
                            <div className="space-y-1">
                                {["Dashboard", "Inbox", "My Tasks", "Goals"].map((item, i) => (
                                    <div key={item} className={`h-10 w-full rounded-lg flex items-center px-3 text-sm font-medium ${i === 0 ? "bg-white border border-[var(--border-subtle)] shadow-sm text-indigo-600" : "text-[var(--text-secondary)] hover:bg-white/50 transition-colors"}`}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <header className="h-16 border-b border-[var(--border-subtle)] px-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-lg">Product Roadmap 2026</h3>
                                    <div className="h-6 w-px bg-[var(--border-subtle)] mx-2" />
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-9 w-24 bg-white border border-[var(--border-subtle)] rounded-lg shadow-sm" />
                                    <div className="h-9 w-28 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20" />
                                </div>
                            </header>

                            <div className="flex-1 p-8 bg-slate-50/30 overflow-hidden">
                                <div className="flex gap-6 h-full">
                                    {[
                                        { label: "Research", count: 4, color: "bg-orange-400" },
                                        { label: "Design", count: 2, color: "bg-indigo-400" },
                                        { label: "Development", count: 6, color: "bg-blue-400" }
                                    ].map((col, idx) => (
                                        <div key={idx} className="w-80 flex-shrink-0 flex flex-col gap-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                                    <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">{col.label}</span>
                                                </div>
                                                <span className="text-[10px] bg-white border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-md font-bold">{col.count}</span>
                                            </div>
                                            {[1, 2].map(card => (
                                                <div key={card} className="bg-white p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm hover:translate-y-[-2px] transition-transform duration-300">
                                                    <div className="h-3 w-3/4 bg-slate-100 rounded mb-3" />
                                                    <div className="h-2 w-1/2 bg-slate-50 rounded mb-4" />
                                                    <div className="flex justify-between items-center pt-2">
                                                        <div className="flex gap-1">
                                                            <div className="w-5 h-5 rounded-full bg-slate-100" />
                                                            <div className="w-5 h-5 rounded-full bg-slate-100" />
                                                        </div>
                                                        <div className="h-4 w-12 bg-slate-50 rounded" />
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
