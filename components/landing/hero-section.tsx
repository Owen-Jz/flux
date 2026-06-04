"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { HeroPlanningDemo } from "@/components/landing/hero-planning-demo";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// Static gradient orbs — opacity layering instead of blur for performance.
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-gradient-to-br from-[var(--brand-primary)]/25 via-[var(--info-primary)]/15 to-transparent rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-gradient-to-bl from-[var(--info-primary)]/20 via-[var(--brand-secondary)]/15 to-transparent rounded-full"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-[min(400px,60vw)] h-[min(400px,60vw)] bg-gradient-to-tr from-[var(--brand-secondary)]/20 via-[var(--brand-primary)]/15 to-transparent rounded-full"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
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
  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[var(--background)] flex items-center"
      aria-labelledby="hero-heading"
    >
      <GradientOrbs />
      <GridPattern />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left: copy */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.6 }} className="mb-6 flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)]/80 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] backdrop-blur-xl">
                <SparklesIcon className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span className="text-[var(--brand-primary)]">AI project planning</span>
                <span className="text-[var(--text-tertiary)]">— built in</span>
              </span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--text-primary)] leading-[1.05] mb-6 tracking-tight"
            >
              Describe your project.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--info-primary)]">
                Flux plans it.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed"
            >
              Type what you&apos;re building. Get a full project board — tasks, priorities,
              time estimates — in seconds.
            </motion.p>

            <motion.div variants={fadeInUp} transition={{ duration: 0.6 }} className="flex justify-center lg:justify-start">
              <Link
                href="/signup"
                className="group relative px-8 py-4 bg-[var(--brand-primary)] text-white rounded-2xl text-base font-extrabold shadow-xl shadow-[var(--brand-primary)]/25 hover:shadow-2xl hover:shadow-[var(--brand-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Get started free
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-5 text-sm text-[var(--text-tertiary)]"
            >
              No credit card required. Start planning in 60 seconds.
            </motion.p>
          </motion.div>

          {/* Right: live demo */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <HeroPlanningDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
