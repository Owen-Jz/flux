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
        <section ref={ref} id="how-it-works" className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] overflow-hidden" aria-labelledby="how-it-works-heading">
            {/* Background elements */}
            <div className="absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[var(--brand-primary)]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--brand-secondary)]/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center max-w-2xl mb-12 lg:mb-20">
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        See It In Action
                    </span>
                    <h2 id="how-it-works-heading" className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        From chaos to clarity
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                        No complex setup. No endless configuration. Just add your team and start shipping.
                    </p>
                </div>

                <motion.div
                    style={{ scale, rotate }}
                    className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]"
                >
                    <div className="h-11 border-b border-[var(--border-subtle)] bg-[var(--background-subtle)] flex items-center px-5 gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
                            <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                        </div>
                        <div className="flex-1 flex justify-center lg:pr-12">
                            <div className="h-6 w-full max-w-md bg-[var(--surface)] rounded-md border border-[var(--border-subtle)] flex items-center px-3 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                                <div className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-widest">flux.so/workspace/main</div>
                            </div>
                        </div>
                    </div>

                    {/* Application Mockup */}
                    <div className="aspect-[16/10] w-full bg-[var(--surface)] flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-56 lg:w-64 border-r border-[var(--border-subtle)] bg-[var(--background-subtle)] p-5 lg:p-6 hidden lg:flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--text-inverse)]">
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
                                                ? "bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm text-[var(--brand-primary)]"
                                                : "text-[var(--text-tertiary)] hover:bg-[var(--background-subtle)] transition-colors"
                                        }`}
                                    >
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <header className="h-14 border-b border-[var(--border-subtle)] px-6 lg:px-8 flex items-center justify-between bg-[var(--surface)]">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-[var(--text-primary)]">Product Roadmap 2026</h3>
                                    <div className="h-6 w-px bg-[var(--border-subtle)] mx-2 hidden sm:block" />
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--background-subtle)]" />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-9 w-24 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded-lg shadow-sm" />
                                    <div className="h-9 w-28 bg-[var(--brand-primary)] rounded-lg shadow-lg shadow-[var(--brand-primary)]/20" />
                                </div>
                            </header>

                            <div className="flex-1 p-4 sm:p-5 lg:p-8 bg-[var(--background-subtle)] overflow-hidden">
                                {/* Horizontal scroll container for kanban columns on mobile */}
                                <div className="flex gap-3 sm:gap-4 lg:gap-5 h-full overflow-x-auto pb-2 snap-x">
                                    {[
                                        { label: "Backlog", count: 6, color: "bg-[var(--text-tertiary)]" },
                                        { label: "To Do", count: 4, color: "bg-blue-500" },
                                        { label: "In Progress", count: 3, color: "bg-amber-500" },
                                        { label: "Review", count: 2, color: "bg-purple-500" },
                                        { label: "Done", count: 8, color: "bg-emerald-500" }
                                    ].map((col, idx) => (
                                        <div key={idx} className="w-48 sm:w-52 lg:w-60 flex-shrink-0 flex flex-col gap-2 lg:gap-3 snap-start">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                                    <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-tertiary)]">{col.label}</span>
                                                </div>
                                                <span className="text-[10px] bg-[var(--surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-md font-bold text-[var(--text-secondary)]">{col.count}</span>
                                            </div>
                                            {[1, 2].map(card => (
                                                <div key={card} className="bg-[var(--surface)] p-3 sm:p-4 lg:p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                                                    <div className="h-2.5 sm:h-3 w-3/4 bg-[var(--background-subtle)] rounded mb-2 sm:mb-3" />
                                                    <div className="h-2 w-1/2 bg-[var(--background-subtle)] rounded mb-3 sm:mb-4" />
                                                    <div className="flex justify-between items-center pt-1 sm:pt-2">
                                                        <div className="flex gap-1">
                                                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--background-subtle)]" />
                                                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--background-subtle)]" />
                                                        </div>
                                                        <div className="h-3 sm:h-4 w-10 sm:w-12 bg-[var(--background-subtle)] rounded" />
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
