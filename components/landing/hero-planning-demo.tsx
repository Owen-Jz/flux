"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";

// Purely presentational simulation of the "describe -> board appears" moment.
// No API calls, no auth. Loops so a visitor always sees the payoff.

const PROMPT = "Build a client portfolio site for a photography studio, 2-week deadline.";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface DemoCard {
    title: string;
    priority: Priority;
    column: number; // index into COLUMNS
}

const COLUMNS = ["Backlog", "In Progress", "Review", "Done"] as const;

const CARDS: DemoCard[] = [
    { title: "Design homepage layout", priority: "HIGH", column: 0 },
    { title: "Set up CMS for galleries", priority: "HIGH", column: 0 },
    { title: "Implement contact form", priority: "MEDIUM", column: 0 },
    { title: "Mobile responsive pass", priority: "MEDIUM", column: 1 },
    { title: "Client review session", priority: "MEDIUM", column: 1 },
    { title: "Final handoff", priority: "LOW", column: 0 },
];

const PRIORITY_STYLES: Record<Priority, string> = {
    HIGH: "bg-red-500/15 text-red-600 dark:text-red-400",
    MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    LOW: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

type Phase = "typing" | "thinking" | "revealing" | "hold";

export function HeroPlanningDemo() {
    const [typed, setTyped] = useState("");
    const [phase, setPhase] = useState<Phase>("typing");
    const [visibleCards, setVisibleCards] = useState(0);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const schedule = (fn: () => void, ms: number) => {
            timers.current.push(setTimeout(fn, ms));
        };

        const runCycle = () => {
            // Reset
            setTyped("");
            setVisibleCards(0);
            setPhase("typing");

            // Phase 1: type the prompt character by character
            let i = 0;
            const typeNext = () => {
                i += 1;
                setTyped(PROMPT.slice(0, i));
                if (i < PROMPT.length) {
                    schedule(typeNext, 38);
                } else {
                    // Phase 2: brief "thinking"
                    schedule(() => setPhase("thinking"), 500);
                    schedule(() => {
                        setPhase("revealing");
                        // Phase 3: drop cards in one at a time
                        for (let c = 1; c <= CARDS.length; c++) {
                            schedule(() => setVisibleCards(c), c * 320);
                        }
                        // Phase 4: hold, then loop
                        schedule(() => setPhase("hold"), CARDS.length * 320 + 400);
                        schedule(runCycle, CARDS.length * 320 + 3200);
                    }, 1100);
                }
            };
            schedule(typeNext, 600);
        };

        runCycle();
        return () => {
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
    }, []);

    const showBoard = phase === "revealing" || phase === "hold";

    return (
        <div
            aria-hidden="true"
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/[0.08] dark:shadow-black/40 overflow-hidden select-none"
        >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--background)]/40">
                <span className="w-3 h-3 rounded-full bg-red-400/70" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-xs font-medium text-[var(--text-tertiary)]">flux · Plan with AI</span>
            </div>

            {/* Prompt input */}
            <div className="px-4 pt-4 pb-3">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/60 px-4 py-3 min-h-[64px]">
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {typed}
                        {phase === "typing" && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="inline-block w-[2px] h-4 align-middle ml-0.5 bg-[var(--brand-primary)]"
                            />
                        )}
                    </p>
                </div>

                {/* Generate button */}
                <div className="flex justify-end mt-3">
                    <motion.div
                        animate={
                            phase === "thinking"
                                ? { scale: [1, 0.96, 1] }
                                : { scale: 1 }
                        }
                        transition={{ duration: 0.5, repeat: phase === "thinking" ? Infinity : 0 }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        {phase === "thinking" ? "Planning…" : "Generate Plan"}
                    </motion.div>
                </div>
            </div>

            {/* Board */}
            <div className="px-4 pb-4">
                <div className="grid grid-cols-4 gap-2">
                    {COLUMNS.map((col, colIndex) => (
                        <div key={col} className="rounded-lg bg-[var(--background)]/50 p-2 min-h-[140px]">
                            <AnimatePresence>
                                {showBoard && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: colIndex * 0.08 }}
                                        className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-2 px-1"
                                    >
                                        {col}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <AnimatePresence>
                                    {showBoard &&
                                        CARDS.filter((c) => c.column === colIndex).map((card) => {
                                            const globalIndex = CARDS.indexOf(card);
                                            if (globalIndex >= visibleCards) return null;
                                            return (
                                                <motion.div
                                                    key={card.title}
                                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] p-2 shadow-sm"
                                                >
                                                    <p className="text-[11px] font-medium text-[var(--text-primary)] leading-snug mb-1.5">
                                                        {card.title}
                                                    </p>
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${PRIORITY_STYLES[card.priority]}`}
                                                    >
                                                        {card.priority}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
