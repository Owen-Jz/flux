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
      className="py-24 lg:py-40 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 dark:from-purple-900/20 via-slate-50 dark:via-slate-950 to-blue-100 dark:to-blue-900/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.03]" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
            Get Started Today
          </span>

          <h2 id="cta-heading" className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Ready to transform
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 dark:from-purple-400 to-blue-600 dark:to-blue-400">
              your workflow?
            </span>
          </h2>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of high-performing teams who rely on Flux to ship faster.
            No credit card required. Setup in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {/* Primary CTA */}
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="flex items-center gap-2">
                Start your free trial
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="#contact"
              className="px-8 py-4 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center gap-2 backdrop-blur-xl"
            >
              Contact sales
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-500" />
              <span>Free for teams up to 5 members</span>
            </div>
            <div className="flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-amber-500" />
              <span>Setup in minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
