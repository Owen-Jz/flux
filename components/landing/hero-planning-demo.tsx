"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import type { AIPlan } from "@/types/ai-plan";

// Interactive hero demo. In "attract" mode it auto-types a sample brief and
// streams an example board. The moment the visitor clicks the prompt it flips
// to "interactive": they type their own project and "Generate Plan" calls the
// public, rate-limited /api/ai/plan/try endpoint to produce a real plan, then
// invites them to sign up to save it.

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

const LOADING_MESSAGES = [
    "Analysing your project…",
    "Identifying the work…",
    "Planning tasks…",
    "Estimating effort…",
];

type AttractPhase = "typing" | "thinking" | "revealing" | "hold";
type Mode = "attract" | "interactive" | "loading" | "result" | "error";

interface HeroPlanningDemoProps {
    /** Called with the visitor's prompt when they choose to sign up to save it. */
    onSignup: (prompt: string) => void;
}

export function HeroPlanningDemo({ onSignup }: HeroPlanningDemoProps) {
    const [typed, setTyped] = useState("");
    const [attractPhase, setAttractPhase] = useState<AttractPhase>("typing");
    const [visibleCards, setVisibleCards] = useState(0);
    const [mode, setMode] = useState<Mode>("attract");
    const [plan, setPlan] = useState<AIPlan | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [errorSignup, setErrorSignup] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState(0);

    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const modeRef = useRef<Mode>("attract");
    const abortRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };
    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Attract-mode animation loop. Stops the moment the visitor takes over.
    useEffect(() => {
        if (mode !== "attract") return;
        const schedule = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

        const runCycle = () => {
            if (modeRef.current !== "attract") return;
            setTyped("");
            setVisibleCards(0);
            setAttractPhase("typing");

            let i = 0;
            const typeNext = () => {
                if (modeRef.current !== "attract") return;
                i += 1;
                setTyped(SAMPLE_PROMPT.slice(0, i));
                if (i < SAMPLE_PROMPT.length) {
                    schedule(typeNext, 38);
                } else {
                    schedule(() => setAttractPhase("thinking"), 500);
                    schedule(() => {
                        if (modeRef.current !== "attract") return;
                        setAttractPhase("revealing");
                        for (let c = 1; c <= CARDS.length; c++) schedule(() => setVisibleCards(c), c * 320);
                        schedule(() => setAttractPhase("hold"), CARDS.length * 320 + 400);
                        schedule(runCycle, CARDS.length * 320 + 3200);
                    }, 1100);
                }
            };
            schedule(typeNext, 600);
        };

        runCycle();
        return clearTimers;
    }, [mode]);

    // Cycle loading messages while generating.
    useEffect(() => {
        if (mode !== "loading") return;
        const id = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 1400);
        return () => clearInterval(id);
    }, [mode]);

    // Abort any in-flight request on unmount.
    useEffect(() => () => abortRef.current?.abort(), []);

    const enterInteractive = () => {
        if (modeRef.current === "interactive") return;
        if (modeRef.current === "attract") {
            clearTimers();
            setTyped("");
        }
        setModeBoth("interactive");
        setErrorMsg("");
        timers.current.push(setTimeout(() => textareaRef.current?.focus(), 0));
    };

    const generate = async () => {
        const description = typed.trim();
        if (description.length < 10) {
            setErrorMsg("Tell us a bit more about your project — at least a sentence.");
            setErrorSignup(false);
            setModeBoth("error");
            return;
        }
        setLoadingMsg(0);
        setModeBoth("loading");
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const res = await fetch("/api/ai/plan/try", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
                signal: controller.signal,
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMsg(data?.error || "Could not generate a plan. Please try again.");
                setErrorSignup(Boolean(data?.signupHint));
                setModeBoth("error");
                return;
            }
            setPlan(data as AIPlan);
            setModeBoth("result");
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            setErrorMsg("Connection problem — please try again.");
            setErrorSignup(false);
            setModeBoth("error");
        }
    };

    const tryAgain = () => {
        setErrorMsg("");
        setPlan(null);
        setModeBoth("interactive");
        timers.current.push(setTimeout(() => textareaRef.current?.focus(), 0));
    };

    const showAttractBoard = mode === "attract" && (attractPhase === "revealing" || attractPhase === "hold");
    const isInteractiveLike = mode === "interactive" || mode === "loading" || mode === "error";

    return (
        <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/[0.08] dark:shadow-black/40 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--background)]/40">
                <span className="w-3 h-3 rounded-full bg-red-400/70" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/70" aria-hidden="true" />
                <span className="ml-2 text-xs font-medium text-[var(--text-tertiary)]">flux · Plan with AI</span>
            </div>

            {/* Prompt input (hidden once a real plan is shown) */}
            {mode !== "result" && (
                <div className="px-4 pt-4 pb-3">
                    <label htmlFor="hero-prompt" className="sr-only">
                        Describe your project
                    </label>
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/60 px-3 py-2 focus-within:border-[var(--brand-primary)] transition-colors">
                        <textarea
                            id="hero-prompt"
                            ref={textareaRef}
                            value={typed}
                            readOnly={mode !== "interactive" && mode !== "error"}
                            disabled={mode === "loading"}
                            onClick={enterInteractive}
                            onFocus={enterInteractive}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    generate();
                                }
                            }}
                            rows={2}
                            maxLength={500}
                            placeholder={isInteractiveLike ? "Describe your project — what are you building?" : undefined}
                            aria-label="Describe your project"
                            className="w-full resize-none bg-transparent text-sm text-[var(--text-primary)] leading-relaxed outline-none placeholder:text-[var(--text-tertiary)] cursor-text disabled:opacity-60"
                        />
                        {mode === "attract" && attractPhase === "typing" && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                aria-hidden="true"
                                className="inline-block w-[2px] h-4 align-middle -mt-1 bg-[var(--brand-primary)]"
                            />
                        )}
                    </div>

                    <div className="flex justify-end mt-3">
                        <motion.button
                            type="button"
                            onClick={generate}
                            disabled={mode === "loading"}
                            whileTap={{ scale: 0.97 }}
                            animate={mode === "attract" && attractPhase === "thinking" ? { scale: [1, 0.96, 1] } : { scale: 1 }}
                            transition={{ duration: 0.5, repeat: mode === "attract" && attractPhase === "thinking" ? Infinity : 0 }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-70 transition-opacity"
                        >
                            {mode === "loading" ? (
                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <SparklesIcon className="w-3.5 h-3.5" />
                            )}
                            {mode === "loading"
                                ? "Planning…"
                                : mode === "attract" && attractPhase === "thinking"
                                  ? "Planning…"
                                  : "Generate Plan"}
                        </motion.button>
                    </div>

                    {mode === "error" && (
                        <div className="mt-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] px-3 py-2">
                            <p className="text-xs text-[var(--error-text-strong)]">{errorMsg}</p>
                            {errorSignup && (
                                <button
                                    type="button"
                                    onClick={() => onSignup(typed.trim() || SAMPLE_PROMPT)}
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                                >
                                    Sign up free <ArrowRightIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Body: attract board, loading state, or the real result */}
            <div className="px-4 pb-4">
                {/* Loading */}
                {mode === "loading" && (
                    <div className="min-h-[140px] flex flex-col items-center justify-center gap-3 text-center">
                        <ArrowPathIcon className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={loadingMsg}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="text-sm text-[var(--text-secondary)]"
                            >
                                {LOADING_MESSAGES[loadingMsg]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                )}

                {/* Real generated plan */}
                {mode === "result" && plan && (
                    <div>
                        <div className="mb-3">
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{plan.title}</p>
                            {plan.summary && (
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{plan.summary}</p>
                            )}
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                            {(plan.tasks ?? []).map((task, i) => (
                                <motion.div
                                    key={`${task.title}-${i}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.05 }}
                                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--background)]/50 p-2 flex items-start justify-between gap-2"
                                >
                                    <p className="text-[11px] font-medium text-[var(--text-primary)] leading-snug">{task.title}</p>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {typeof task.estimatedHours === "number" && task.estimatedHours > 0 && (
                                            <span className="text-[9px] font-semibold text-[var(--text-tertiary)]">
                                                ~{task.estimatedHours}h
                                            </span>
                                        )}
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${PRIORITY_STYLES[task.priority as Priority] ?? PRIORITY_STYLES.MEDIUM}`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onSignup(typed.trim() || SAMPLE_PROMPT)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Sign up free to save this plan <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={tryAgain}
                                className="px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-semibold hover:bg-[var(--background-subtle)] transition-colors"
                            >
                                Try another
                            </button>
                        </div>
                    </div>
                )}

                {/* Attract / interactive example board */}
                {mode !== "loading" && mode !== "result" && (
                    <>
                        {isInteractiveLike && (
                            <p className="text-[10px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
                                Example output
                            </p>
                        )}
                        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                            {COLUMNS.map((col, colIndex) => {
                                const showBoard = showAttractBoard || isInteractiveLike;
                                const cardsVisible = isInteractiveLike ? CARDS.length : visibleCards;
                                return (
                                    <div key={col} className="rounded-lg bg-[var(--background)]/50 p-2 min-h-[140px]">
                                        {showBoard && (
                                            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-2 px-1">
                                                {col}
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            {showBoard &&
                                                CARDS.filter((c) => c.column === colIndex).map((card) => {
                                                    const globalIndex = CARDS.indexOf(card);
                                                    if (globalIndex >= cardsVisible) return null;
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
