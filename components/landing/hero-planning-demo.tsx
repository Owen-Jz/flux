"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";

// Interactive hero demo. In "attract" mode it auto-types a sample brief and
// streams an example board — the payoff visual. The moment the visitor clicks
// into the prompt it flips to "interactive": they type their own project and
// "Generate Plan" hands the prompt to signup (we never call the paid LLM
// endpoint anonymously).

const SAMPLE_PROMPT = "Build a client portfolio site for a photography studio, 2-week deadline.";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface DemoCard {
    title: string;
    priority: Priority;
    column: number;
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

interface HeroPlanningDemoProps {
    /** Called with the visitor's prompt (or the sample) when they hit Generate. */
    onSubmit: (prompt: string) => void;
}

export function HeroPlanningDemo({ onSubmit }: HeroPlanningDemoProps) {
    const [typed, setTyped] = useState("");
    const [phase, setPhase] = useState<Phase>("typing");
    const [visibleCards, setVisibleCards] = useState(0);
    const [interactive, setInteractive] = useState(false);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const interactiveRef = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };

    // Attract-mode animation loop. Stops as soon as the visitor takes over.
    useEffect(() => {
        if (interactive) return;
        const schedule = (fn: () => void, ms: number) => {
            timers.current.push(setTimeout(fn, ms));
        };

        const runCycle = () => {
            if (interactiveRef.current) return;
            setTyped("");
            setVisibleCards(0);
            setPhase("typing");

            let i = 0;
            const typeNext = () => {
                if (interactiveRef.current) return;
                i += 1;
                setTyped(SAMPLE_PROMPT.slice(0, i));
                if (i < SAMPLE_PROMPT.length) {
                    schedule(typeNext, 38);
                } else {
                    schedule(() => setPhase("thinking"), 500);
                    schedule(() => {
                        if (interactiveRef.current) return;
                        setPhase("revealing");
                        for (let c = 1; c <= CARDS.length; c++) {
                            schedule(() => setVisibleCards(c), c * 320);
                        }
                        schedule(() => setPhase("hold"), CARDS.length * 320 + 400);
                        schedule(runCycle, CARDS.length * 320 + 3200);
                    }, 1100);
                }
            };
            schedule(typeNext, 600);
        };

        runCycle();
        return clearTimers;
    }, [interactive]);

    const enterInteractive = () => {
        if (interactiveRef.current) return;
        interactiveRef.current = true;
        clearTimers();
        setInteractive(true);
        setTyped("");
        // Show the example board as a static reference while they type.
        setVisibleCards(CARDS.length);
        setPhase("hold");
        // Focus on the next tick once the textarea is editable.
        timers.current.push(setTimeout(() => textareaRef.current?.focus(), 0));
    };

    const handleSubmit = () => {
        onSubmit(typed.trim() || SAMPLE_PROMPT);
    };

    const showBoard = phase === "revealing" || phase === "hold";

    return (
        <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/[0.08] dark:shadow-black/40 overflow-hidden select-none">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--background)]/40">
                <span className="w-3 h-3 rounded-full bg-red-400/70" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/70" aria-hidden="true" />
                <span className="ml-2 text-xs font-medium text-[var(--text-tertiary)]">flux · Plan with AI</span>
            </div>

            {/* Prompt input */}
            <div className="px-4 pt-4 pb-3">
                <label htmlFor="hero-prompt" className="sr-only">
                    Describe your project
                </label>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/60 px-3 py-2 focus-within:border-[var(--brand-primary)] transition-colors">
                    <textarea
                        id="hero-prompt"
                        ref={textareaRef}
                        value={typed}
                        readOnly={!interactive}
                        onClick={enterInteractive}
                        onFocus={enterInteractive}
                        onChange={(e) => setTyped(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        rows={2}
                        maxLength={500}
                        placeholder={interactive ? "Describe your project — what are you building?" : undefined}
                        aria-label="Describe your project"
                        className="w-full resize-none bg-transparent text-sm text-[var(--text-primary)] leading-relaxed outline-none placeholder:text-[var(--text-tertiary)] cursor-text"
                    />
                    {!interactive && phase === "typing" && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            aria-hidden="true"
                            className="inline-block w-[2px] h-4 align-middle -mt-1 bg-[var(--brand-primary)]"
                        />
                    )}
                </div>

                {/* Generate button */}
                <div className="flex justify-end mt-3">
                    <motion.button
                        type="button"
                        onClick={handleSubmit}
                        whileTap={{ scale: 0.97 }}
                        animate={!interactive && phase === "thinking" ? { scale: [1, 0.96, 1] } : { scale: 1 }}
                        transition={{ duration: 0.5, repeat: !interactive && phase === "thinking" ? Infinity : 0 }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        {!interactive && phase === "thinking" ? "Planning…" : "Generate Plan"}
                    </motion.button>
                </div>
            </div>

            {/* Board */}
            <div className="px-4 pb-4">
                {interactive && (
                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
                        Example output
                    </p>
                )}
                <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                    {COLUMNS.map((col, colIndex) => (
                        <div key={col} className="rounded-lg bg-[var(--background)]/50 p-2 min-h-[140px]">
                            <AnimatePresence>
                                {showBoard && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: interactive ? 0 : colIndex * 0.08 }}
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
