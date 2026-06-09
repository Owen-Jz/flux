"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  SparklesIcon,
  BoltIcon,
  CheckIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { HeroPlanningDemo } from "@/components/landing/hero-planning-demo";

// Lazy-loaded so the Remotion player + composition stay out of the initial bundle
// and never run during SSR. The chunk is fetched the first time the modal opens.
const HeroVideoModal = dynamic(() => import("@/components/landing/hero-video-modal"), {
  ssr: false,
});

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

// Honest, verifiable trust signals — no invented metrics.
const BENEFITS: { icon: typeof CheckIcon; label: string }[] = [
  { icon: CheckIcon, label: "Free forever plan" },
  { icon: CheckIcon, label: "No credit card" },
  { icon: BoltIcon, label: "Plan in ~60s" },
];

// Illustrative avatar cluster — matches the colour set used across the product's
// dashboard mocks. Conveys "real people use this" without claiming a hard count.
const SOCIAL_AVATARS: { initials: string; color: string }[] = [
  { initials: "JD", color: "#3b82f6" },
  { initials: "SK", color: "#10b981" },
  { initials: "MR", color: "#f59e0b" },
  { initials: "AL", color: "#8b5cf6" },
  { initials: "EM", color: "#ec4899" },
];

// Ambient background — layered gradient orbs plus a top spotlight. Opacity
// layering over heavy blur keeps this cheap to paint.
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top spotlight cone */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full bg-[radial-gradient(ellipse_at_center,var(--brand-primary)_0%,transparent_62%)] opacity-[0.12] dark:opacity-[0.18]" />

      <motion.div
        className="absolute top-1/4 left-1/4 w-[min(620px,80vw)] h-[min(620px,80vw)] bg-gradient-to-br from-[var(--brand-primary)]/25 via-[var(--info-primary)]/15 to-transparent rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-gradient-to-bl from-[var(--info-primary)]/20 via-[var(--brand-secondary)]/15 to-transparent rounded-full"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-[min(420px,60vw)] h-[min(420px,60vw)] bg-gradient-to-tr from-[var(--brand-secondary)]/20 via-[var(--brand-primary)]/15 to-transparent rounded-full"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fade the hero into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[var(--background)]" />
    </div>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
      <svg className="w-full h-full">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);

  // When the visitor chooses to save their generated plan, stash the prompt (in
  // sessionStorage, so their project text never lands in the URL/history) and
  // send them to signup. After they have an account, the board picks it up and
  // re-generates the plan they can keep.
  const handleDemoSignup = (prompt: string) => {
    const q = prompt.trim().slice(0, 500);
    try {
      if (q) sessionStorage.setItem("flux_pending_plan", q);
    } catch {
      /* sessionStorage unavailable (private mode / blocked) — proceed anyway */
    }
    router.push("/signup");
  };

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[var(--background)] flex items-center"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />
      <GridPattern />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-28 pb-20 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left: copy */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.6 }} className="mb-6 flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)]/80 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] backdrop-blur-xl shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75 hero-pulse" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                </span>
                <span className="text-[var(--brand-primary)]">AI project planning</span>
                <span className="text-[var(--text-tertiary)]">— built in</span>
              </span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black text-[var(--text-primary)] leading-[1.04] mb-6 tracking-tight"
            >
              Describe your project.
              <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--info-primary)] to-[var(--brand-secondary)]">
                  Flux plans it.
                </span>
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 -bottom-1 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--info-primary)]"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed"
            >
              Type what you&apos;re building. Flux turns it into a complete project
              board — tasks, priorities, and time estimates — in seconds, not spreadsheets.
            </motion.p>

            {/* Trust chips */}
            <motion.ul
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-8 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2"
            >
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                  <Icon className="w-4 h-4 text-[var(--brand-primary)]" />
                  {label}
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              <Link
                href="/signup"
                className="group relative w-full sm:w-auto px-8 py-4 bg-[var(--brand-primary)] text-white rounded-2xl text-base font-extrabold shadow-xl shadow-[var(--brand-primary)]/25 hover:shadow-2xl hover:shadow-[var(--brand-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Get started free
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                aria-haspopup="dialog"
                className="group w-full sm:w-auto px-6 py-4 rounded-2xl text-base font-bold text-[var(--text-primary)] border border-[var(--border-default)] bg-[var(--surface)]/60 backdrop-blur-sm hover:bg-[var(--surface)] hover:border-[var(--brand-primary)]/40 transition-all flex items-center justify-center gap-2"
              >
                <PlayCircleIcon className="w-5 h-5 text-[var(--brand-primary)] transition-transform group-hover:scale-110" />
                See how it works
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-3"
            >
              <div className="flex -space-x-2">
                {SOCIAL_AVATARS.map(({ initials, color }) => (
                  <span
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--text-tertiary)] leading-snug">
                Built for freelancers, indie builders
                <br className="hidden sm:block" /> &amp; small teams shipping faster.
              </p>
            </motion.div>
          </motion.div>

          {/* Right: live demo */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Soft glow behind the card to make it the focal point */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 bg-gradient-to-tr from-[var(--brand-primary)]/25 via-[var(--info-primary)]/10 to-transparent rounded-[2.5rem] blur-2xl opacity-70"
            />

            <div className="relative w-full max-w-xl">
              {/* "Live demo" pill — this card really does call the AI in real time */}
              <motion.span
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-primary)] shadow-lg"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                Live demo — try it
              </motion.span>

              <HeroPlanningDemo onSignup={handleDemoSignup} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#how-it-works"
        aria-label="Scroll to how it works"
        className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider">Scroll</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-[var(--border-default)] p-1">
          <span className="hero-scroll-dot h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
        </span>
      </a>

      {/* Interactive Remotion ad — opens from the "See how it works" button */}
      {videoOpen ? <HeroVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} /> : null}
    </section>
  );
}
