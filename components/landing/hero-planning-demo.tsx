"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    SparklesIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    CheckIcon,
    ClockIcon,
} from "@heroicons/react/24/solid";
import type { AIPlan } from "@/types/ai-plan";
import { getPlanLoadingMessages } from "@/lib/plan-loading-messages";

// Interactive hero demo. In "attract" mode it auto-types a sample brief, glides a
// branded cursor to the Generate button, "clicks" it, shows a brief planning
// state, then streams an example board into a fixed-height dashboard frame (so the
// loop never reflows). It then plays a short interaction — the cursor hovers
// cards and completes a task. The moment the visitor touches the prompt it flips
// to "interactive": they type their own project and "Generate Plan" calls the
// public, rate-limited /api/ai/plan/try endpoint to produce a real plan, then
// invites them to sign up to save it.

const SAMPLE_PROMPT = "Build a client portfolio site for a photography studio, 2-week deadline.";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface DemoCard {
    title: string;
    priority: Priority;
    column: number;
    hours: number;
    progress?: number;
    done?: boolean;
}

const COLUMNS = ["Backlog", "In Progress", "Review", "Done"] as const;

// Reveal order = array order, so the board fills left-to-right like a real plan.
const CARDS: DemoCard[] = [
    { title: "Set up CMS for galleries", priority: "HIGH", column: 0, hours: 8 },
    { title: "Contact + booking form", priority: "MEDIUM", column: 0, hours: 6 },
    { title: "Design homepage layout", priority: "HIGH", column: 1, hours: 10, progress: 70 },
    { title: "Build gallery grid", priority: "MEDIUM", column: 1, hours: 7, progress: 35 },
    { title: "Mobile responsive pass", priority: "LOW", column: 2, hours: 5 },
    { title: "SEO + metadata", priority: "LOW", column: 2, hours: 4 },
    { title: "Wireframes & moodboard", priority: "LOW", column: 3, hours: 3, done: true },
];

// The card the scripted cursor walks over and then "completes".
const COMPLETE_INDEX = 3;

const COLUMN_COUNTS: number[] = COLUMNS.map((_, i) => CARDS.filter((c) => c.column === i).length);

const HEADER_AVATARS: { initials: string; color: string }[] = [
    { initials: "AK", color: "#3b82f6" },
    { initials: "RS", color: "#10b981" },
    { initials: "ML", color: "#f59e0b" },
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

// Fixed height for the board frame — the single source of stability that keeps
// the attract animation from reflowing as cards appear.
const BOARD_HEIGHT = 300;

type AttractPhase = "typing" | "moving" | "clicking" | "thinking" | "revealing" | "interacting" | "hold";
type Mode = "attract" | "interactive" | "loading" | "result" | "error";

interface HeroPlanningDemoProps {
    /** Called with the visitor's prompt when they choose to sign up to save it. */
    onSignup: (prompt: string) => void;
}

export function HeroPlanningDemo({ onSignup }: HeroPlanningDemoProps) {
    const prefersReducedMotion = useReducedMotion() === true;

    const [typed, setTyped] = useState("");
    const [attractPhase, setAttractPhase] = useState<AttractPhase>("typing");
    const [visibleCards, setVisibleCards] = useState(0);
    const [mode, setMode] = useState<Mode>("attract");
    const [plan, setPlan] = useState<AIPlan | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [errorSignup, setErrorSignup] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState(0);
    const [loadingMessages, setLoadingMessages] = useState<string[]>(LOADING_MESSAGES);

    // Scripted interaction state.
    const [focusIdx, setFocusIdx] = useState<number | null>(null);
    const [completedIdx, setCompletedIdx] = useState<number | null>(null);

    // Branded cursor state (attract mode only).
    const [cursorOn, setCursorOn] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [cursorDown, setCursorDown] = useState(false);
    const [clickPing, setClickPing] = useState(0);

    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const modeRef = useRef<Mode>("attract");
    const abortRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const genBtnRef = useRef<HTMLButtonElement>(null);
    const cardElRefs = useRef<(HTMLDivElement | null)[]>([]);

    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };
    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    // Centre of an element relative to the card container, for cursor targeting.
    const centerOf = (el: HTMLElement | null): { x: number; y: number } | null => {
        const card = cardRef.current;
        if (!el || !card) return null;
        const c = card.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
    };
    const restPos = (): { x: number; y: number } | null => {
        const card = cardRef.current;
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: r.width * 0.5, y: r.height * 0.26 };
    };

    // Attract-mode animation loop. Stops the moment the visitor takes over.
    useEffect(() => {
        if (mode !== "attract") return;

        // Reduced motion: render the finished board statically, no cursor/typing.
        if (prefersReducedMotion) {
            setTyped(SAMPLE_PROMPT);
            setVisibleCards(CARDS.length);
            setAttractPhase("hold");
            setCursorOn(false);
            setFocusIdx(null);
            setCompletedIdx(null);
            return;
        }

        const schedule = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
        const alive = () => modeRef.current === "attract";

        const runCycle = () => {
            if (!alive()) return;
            setTyped("");
            setVisibleCards(0);
            setAttractPhase("typing");
            setCursorDown(false);
            setFocusIdx(null);
            setCompletedIdx(null);

            // Bring the cursor to rest near the prompt before typing starts.
            const rest = restPos();
            if (rest) setCursorPos(rest);
            setCursorOn(true);

            let i = 0;
            const typeNext = () => {
                if (!alive()) return;
                i += 1;
                setTyped(SAMPLE_PROMPT.slice(0, i));
                if (i < SAMPLE_PROMPT.length) {
                    schedule(typeNext, 34);
                    return;
                }

                // Typing done → glide cursor to the button, click, plan, reveal.
                schedule(() => {
                    if (!alive()) return;
                    setAttractPhase("moving");
                    const target = centerOf(genBtnRef.current);
                    if (target) setCursorPos(target);
                }, 450);

                schedule(() => {
                    if (!alive()) return;
                    setAttractPhase("clicking");
                    setCursorDown(true);
                    setClickPing((p) => p + 1);
                }, 450 + 820);

                schedule(() => {
                    if (!alive()) return;
                    setCursorDown(false);
                    setAttractPhase("thinking");
                }, 450 + 820 + 320);

                const revealStart = 450 + 820 + 320 + 780;
                schedule(() => {
                    if (!alive()) return;
                    setAttractPhase("revealing");
                }, revealStart);
                for (let c = 1; c <= CARDS.length; c++) {
                    schedule(() => {
                        if (!alive()) return;
                        setVisibleCards(c);
                    }, revealStart + c * 220);
                }

                // Scripted interaction: hover two cards, then complete one.
                const interactAt = revealStart + CARDS.length * 220 + 450;
                schedule(() => {
                    if (!alive()) return;
                    setAttractPhase("interacting");
                    setFocusIdx(2);
                    const t = centerOf(cardElRefs.current[2]);
                    if (t) setCursorPos(t);
                }, interactAt);
                schedule(() => {
                    if (!alive()) return;
                    setFocusIdx(COMPLETE_INDEX);
                    const t = centerOf(cardElRefs.current[COMPLETE_INDEX]);
                    if (t) setCursorPos(t);
                }, interactAt + 750);
                schedule(() => {
                    if (!alive()) return;
                    setCursorDown(true);
                    setClickPing((p) => p + 1);
                    setCompletedIdx(COMPLETE_INDEX);
                }, interactAt + 1500);
                schedule(() => {
                    if (!alive()) return;
                    setCursorDown(false);
                }, interactAt + 1500 + 280);
                schedule(() => {
                    if (!alive()) return;
                    setFocusIdx(null);
                    const rp = restPos();
                    if (rp) setCursorPos(rp);
                }, interactAt + 2200);

                const holdAt = interactAt + 2700;
                schedule(() => {
                    if (!alive()) return;
                    setAttractPhase("hold");
                }, holdAt);
                schedule(runCycle, holdAt + 2400);
            };
            schedule(typeNext, 650);
        };

        runCycle();
        return clearTimers;
    }, [mode, prefersReducedMotion]);

    // Cycle loading messages while generating.
    useEffect(() => {
        if (mode !== "loading") return;
        const id = setInterval(() => setLoadingMsg((m) => (m + 1) % loadingMessages.length), 1400);
        return () => clearInterval(id);
    }, [mode, loadingMessages.length]);

    // Abort any in-flight request on unmount.
    useEffect(() => () => abortRef.current?.abort(), []);

    const enterInteractive = () => {
        if (modeRef.current === "interactive") return;
        if (modeRef.current === "attract") {
            clearTimers();
            setTyped("");
            setVisibleCards(0);
            setCursorOn(false);
            setCursorDown(false);
            setFocusIdx(null);
            setCompletedIdx(null);
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
        setLoadingMessages(getPlanLoadingMessages(description));
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

    const isInteractiveLike = mode === "interactive" || mode === "loading" || mode === "error";
    const isThinking = mode === "attract" && attractPhase === "thinking";
    const boardPlanned =
        isInteractiveLike ||
        attractPhase === "revealing" ||
        attractPhase === "interacting" ||
        attractPhase === "hold";
    const revealedCount = isInteractiveLike
        ? CARDS.length
        : attractPhase === "revealing" || attractPhase === "interacting" || attractPhase === "hold"
          ? visibleCards
          : 0;

    // Live stats — count up naturally as the cards reveal.
    const shownCards = CARDS.slice(0, revealedCount);
    const shownTasks = shownCards.length;
    const shownHours = shownCards.reduce((sum, c) => sum + c.hours, 0);
    const doneShown =
        shownCards.filter((c) => c.done).length + (completedIdx !== null && completedIdx < revealedCount ? 1 : 0);

    const boardLabel = isInteractiveLike
        ? "Example output"
        : isThinking
          ? "Planning your board…"
          : boardPlanned
            ? "Your project board"
            : "Live preview";

    const isGenerating = mode === "loading" || attractPhase === "clicking" || isThinking;

    return (
        <div
            ref={cardRef}
            className="relative w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/[0.08] dark:shadow-black/40 overflow-hidden"
        >
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
                            ref={genBtnRef}
                            type="button"
                            onClick={generate}
                            disabled={mode === "loading"}
                            whileTap={{ scale: 0.97 }}
                            animate={attractPhase === "clicking" ? { scale: 0.94 } : { scale: 1 }}
                            transition={{ duration: 0.18 }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-70 transition-opacity"
                        >
                            {isGenerating ? (
                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <SparklesIcon className="w-3.5 h-3.5" />
                            )}
                            {isGenerating ? "Planning…" : "Generate Plan"}
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

            {/* Body: loading state, real result, or the fixed-height example board */}
            <div className="px-4 pb-4">
                {/* Real generated plan */}
                {mode === "result" && plan && (
                    <div>
                        <div className="mb-3">
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{plan.title}</p>
                            {plan.summary && (
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{plan.summary}</p>
                            )}
                        </div>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
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

                {/* Real-request loading state */}
                {mode === "loading" && (
                    <div
                        className="flex flex-col items-center justify-center gap-3 text-center"
                        style={{ height: BOARD_HEIGHT + 64 }}
                    >
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
                                {loadingMessages[loadingMsg % loadingMessages.length]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                )}

                {/* Fixed-height example board — attract + interactive modes */}
                {(mode === "attract" || mode === "interactive" || mode === "error") && (
                    <>
                        <p className="text-[10px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
                            {boardLabel}
                        </p>

                        {/* Header section — project title, deadline, team */}
                        <div className="flex items-center justify-between h-7 mb-2.5">
                            {boardPlanned ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center justify-between w-full gap-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                                            Photography Portfolio
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[9px] font-bold flex-shrink-0">
                                            <ClockIcon className="w-2.5 h-2.5" /> 2 weeks
                                        </span>
                                    </div>
                                    <div className="flex -space-x-1.5 flex-shrink-0" aria-hidden="true">
                                        {HEADER_AVATARS.map(({ initials, color }) => (
                                            <span
                                                key={initials}
                                                className="w-5 h-5 rounded-full border-2 border-[var(--surface)] flex items-center justify-center text-[8px] font-bold text-white"
                                                style={{ backgroundColor: color }}
                                            >
                                                {initials}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-3 w-36 rounded animate-shimmer" />
                            )}
                        </div>

                        {/* Board section — fixed-height columns */}
                        <div className="grid grid-cols-4 gap-2" style={{ height: BOARD_HEIGHT }} aria-hidden="true">
                            {COLUMNS.map((col, colIndex) => (
                                <div key={col} className="flex flex-col rounded-lg bg-[var(--background)]/50 p-2 h-full">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                                            {col}
                                        </span>
                                        <span className="text-[9px] font-bold text-[var(--text-tertiary)]/70 tabular-nums">
                                            {COLUMN_COUNTS[colIndex]}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        {/* Skeleton placeholders while "planning" */}
                                        {isThinking &&
                                            Array.from({ length: COLUMN_COUNTS[colIndex] }).map((_, s) => (
                                                <div
                                                    key={s}
                                                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] p-2"
                                                >
                                                    <div className="h-2 w-3/4 rounded animate-shimmer mb-1.5" />
                                                    <div className="h-2 w-1/3 rounded animate-shimmer" />
                                                </div>
                                            ))}

                                        {/* Revealed cards */}
                                        {!isThinking &&
                                            CARDS.filter((c) => c.column === colIndex).map((card) => {
                                                const globalIndex = CARDS.indexOf(card);
                                                if (globalIndex >= revealedCount) return null;
                                                const isDone = card.done || completedIdx === globalIndex;
                                                const isFocused = focusIdx === globalIndex;
                                                const progressValue =
                                                    completedIdx === globalIndex ? 100 : card.progress;
                                                return (
                                                    <motion.div
                                                        key={card.title}
                                                        ref={(el) => {
                                                            cardElRefs.current[globalIndex] = el;
                                                        }}
                                                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: isFocused ? -2 : 0,
                                                            scale: isFocused ? 1.04 : 1,
                                                        }}
                                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                        className={`rounded-md border bg-[var(--surface)] p-2 transition-shadow ${
                                                            isFocused
                                                                ? "border-[var(--brand-primary)]/60 shadow-lg shadow-[var(--brand-primary)]/15"
                                                                : "border-[var(--border-subtle)] shadow-sm"
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-1.5">
                                                            {isDone && (
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ type: "spring", stiffness: 360, damping: 18 }}
                                                                    className="mt-px flex-shrink-0 w-3.5 h-3.5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                                                                >
                                                                    <CheckIcon className="w-2.5 h-2.5 text-emerald-500" />
                                                                </motion.span>
                                                            )}
                                                            <p
                                                                className={`text-[11px] font-medium leading-snug ${
                                                                    isDone
                                                                        ? "text-[var(--text-tertiary)] line-through"
                                                                        : "text-[var(--text-primary)]"
                                                                }`}
                                                            >
                                                                {card.title}
                                                            </p>
                                                        </div>

                                                        {typeof progressValue === "number" && (
                                                            <div className="mt-1.5 h-1 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progressValue}%` }}
                                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--info-primary)]"
                                                                />
                                                            </div>
                                                        )}

                                                        <span
                                                            className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                                isDone
                                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                    : PRIORITY_STYLES[card.priority]
                                                            }`}
                                                        >
                                                            {isDone ? "DONE" : card.priority}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats footer section */}
                        <div className="flex items-center gap-3 h-6 mt-2.5 text-[10px] font-semibold">
                            {boardPlanned && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-[var(--text-secondary)] tabular-nums">{shownTasks} tasks</span>
                                    <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                                    <span className="text-[var(--text-tertiary)] tabular-nums">~{shownHours}h planned</span>
                                    <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                                    <span className="inline-flex items-center gap-1 text-emerald-500 tabular-nums">
                                        <CheckIcon className="w-3 h-3" />
                                        {doneShown}/{shownTasks} done
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Branded "live" cursor — attract mode only, decorative */}
            {mode === "attract" && cursorOn && (
                <motion.div
                    className="pointer-events-none absolute left-0 top-0 z-30"
                    animate={{ x: cursorPos.x, y: cursorPos.y, scale: cursorDown ? 0.84 : 1 }}
                    transition={{
                        x: { type: "spring", stiffness: 60, damping: 15 },
                        y: { type: "spring", stiffness: 60, damping: 15 },
                        scale: { duration: 0.16 },
                    }}
                    aria-hidden="true"
                >
                    <div className="relative">
                        {/* Click ripple */}
                        <AnimatePresence>
                            {cursorDown && (
                                <motion.span
                                    key={clickPing}
                                    initial={{ scale: 0.3, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-[var(--brand-primary)]/40"
                                />
                            )}
                        </AnimatePresence>

                        {/* Pointer */}
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                        >
                            <path
                                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z"
                                fill="var(--brand-primary)"
                                stroke="white"
                                strokeWidth="1.4"
                            />
                        </svg>

                        {/* Name tag */}
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md rounded-tl-none bg-[var(--brand-primary)] text-white text-[9px] font-bold whitespace-nowrap shadow-md">
                            <SparklesIcon className="w-2.5 h-2.5" />
                            Flux AI
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
