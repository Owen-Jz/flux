"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BoltIcon, UsersIcon, ShieldCheckIcon, ChartBarIcon, GlobeAltIcon, TableCellsIcon, LockClosedIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const benefits = [
  {
    icon: BoltIcon,
    title: "Feels Instant",
    description: "Every click responds right away. No spinning loaders, no waiting around.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: UsersIcon,
    title: "Everyone on the Same Page",
    description: "See who's working on what, right now. No more 'I didn't know that was happening.'",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: ShieldCheckIcon,
    title: "Your Data is Safe",
    description: "Enterprise-grade security that keeps your projects protected, period.",
    gradient: "from-purple-500 to-teal-500",
  },
  {
    icon: ChartBarIcon,
    title: "See Where Time Goes",
    description: "Understand bottlenecks at a glance. Make decisions based on what's actually happening.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: GlobeAltIcon,
    title: "Share with One Link",
    description: "Share your roadmap or project status externally with a simple URL.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: TableCellsIcon,
    title: "Less Busywork",
    description: "Automate the repetitive stuff so your team can focus on what matters.",
    gradient: "from-rose-500 to-red-500",
  },
  {
    icon: LockClosedIcon,
    title: "Control Who Sees What",
    description: "Set permissions for each project. Clients see only what you want them to see.",
    gradient: "from-slate-500 to-zinc-500",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Discussions That Don't Get Lost",
    description: "Comments attached to tasks, not buried in email threads.",
    gradient: "from-cyan-500 to-sky-500",
  },
];

export function ValueProposition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={containerRef}
      className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] relative overflow-hidden"
      aria-labelledby="value-heading"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[var(--brand-primary)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-[var(--info-primary)]/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <motion.div style={{ y }} className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4"
          >
            Why Flux
          </motion.span>
          <motion.h2
            id="value-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-[var(--text-primary)] tracking-tight mb-6"
          >
            Why teams love using
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--info-primary)]">
              Flux
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)]"
          >
            Finally, one place where your whole team collaborates without the chaos.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-xl"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-current/20 transition-all duration-300`}>
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{benefit.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
