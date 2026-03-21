"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, CheckIcon, BoltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section
      ref={containerRef}
      className="py-24 lg:py-40 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/10 via-[var(--background-subtle)] to-[var(--info-primary)]/10" />
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[var(--brand-primary)]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-[var(--info-primary)]/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <motion.div
        style={{ y, scale }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-6">
            Get Started Today
          </span>

          <h2 id="cta-heading" className="text-4xl lg:text-5xl xl:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Ready to transform
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--info-primary)]">
              your workflow?
            </span>
          </h2>

          <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of high-performing teams who rely on Flux to ship faster.
            No credit card required. Setup in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {/* Primary CTA */}
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary)] text-[var(--text-inverse)] rounded-2xl text-base font-extrabold shadow-xl shadow-[var(--brand-primary)]/25 hover:shadow-2xl hover:shadow-[var(--brand-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="flex items-center gap-2">
                Start your free trial
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="#contact"
              className="px-8 py-4 bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-2xl text-base font-bold hover:bg-[var(--background-subtle)] hover:border-[var(--border-default)] transition-all flex items-center gap-2 backdrop-blur-xl"
            >
              Contact sales
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Free for teams up to 5 members</span>
            </div>
            <div className="flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-[var(--warning-primary)]" />
              <span>Setup in minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-[var(--info-primary)]" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
