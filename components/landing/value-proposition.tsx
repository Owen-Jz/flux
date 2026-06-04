"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ClockIcon, SparklesIcon, EyeIcon } from "@heroicons/react/24/outline";

const benefits = [
  {
    icon: ClockIcon,
    title: "Stop planning from scratch",
    description: "Every new client project used to mean an hour of setup. Now it's 30 seconds.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: SparklesIcon,
    title: "Look organised from day one",
    description: "Share a structured board with your client before the first call. First impressions matter.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: EyeIcon,
    title: "Know what's left at a glance",
    description: "Tasks, priorities, and progress in one place. No more piecing it together from messages.",
    gradient: "from-blue-500 to-cyan-500",
  },
];

export function ValueProposition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section
      ref={containerRef}
      className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background)]"
      aria-labelledby="value-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
            Why Flux
          </span>
          <h2 id="value-heading" className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Less setup. More shipping.
          </h2>
        </div>

        <motion.div style={{ y }} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="group p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                <benefit.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{benefit.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
