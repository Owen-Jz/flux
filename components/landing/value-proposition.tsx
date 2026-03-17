"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BoltIcon, UsersIcon, ShieldCheckIcon, ChartBarIcon, GlobeAltIcon, TableCellsIcon, LockClosedIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const benefits = [
  {
    icon: BoltIcon,
    title: "Lightning Fast",
    description: "Sub-second response times with real-time sync across all devices. No more waiting for page loads.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: UsersIcon,
    title: "Built for Teams",
    description: "Seamless collaboration with comments, mentions, and activity feeds that keep everyone aligned.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: ShieldCheckIcon,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with SSO, RBAC, and end-to-end encryption. Your data stays safe.",
    gradient: "from-purple-500 to-teal-500",
  },
  {
    icon: ChartBarIcon,
    title: "Actionable Insights",
    description: "Powerful analytics that surface bottlenecks and help you make data-driven decisions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: GlobeAltIcon,
    title: "Public Sharing",
    description: "Share your roadmap or project status with the world via a simple public link.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: TableCellsIcon,
    title: "Workflow Automation",
    description: "Automate repetitive tasks and keep your team aligned with smart rules.",
    gradient: "from-rose-500 to-red-500",
  },
  {
    icon: LockClosedIcon,
    title: "Granular Permissions",
    description: "Control exactly who can view, edit, or comment on each piece of content.",
    gradient: "from-slate-500 to-zinc-500",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Threaded Discussions",
    description: "Keep conversations organized with nested threads and @mentions.",
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
      className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 relative overflow-hidden"
      aria-labelledby="value-heading"
    >
      {/* Background elements */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.03]" />
      </div>

      <motion.div style={{ y }} className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Why Flux
          </motion.span>
          <motion.h2
            id="value-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6"
          >
            Everything you need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 dark:from-purple-400 to-blue-600 dark:to-blue-400">
              ship faster
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            Stop juggling multiple tools. Flux consolidates your workflow into one powerful platform.
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
              className="group p-6 lg:p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-slate-600/50 hover:shadow-lg dark:hover:bg-slate-800/80 transition-all duration-300 cursor-pointer backdrop-blur-xl"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-current/20 transition-all duration-300`}>
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{benefit.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
