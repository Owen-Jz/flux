"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { CheckCircleIcon, UsersIcon, FolderIcon, BoltIcon } from "@heroicons/react/24/outline";

if (typeof window !== "undefined") {
  gsap.registerPlugin();
}

// Animated number component
function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const obj = { value: 0 };
    gsap.to(obj, {
      value,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => {
        setCount(Math.floor(obj.value));
      },
    });
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const metrics = [
  {
    label: "Tasks Completed Today",
    value: 1247,
    suffix: "+",
    icon: CheckCircleIcon,
    color: "from-purple-500 to-teal-500",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Active Team Members",
    value: 342,
    suffix: "",
    icon: UsersIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Projects In Progress",
    value: 89,
    suffix: "",
    icon: FolderIcon,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Hours Saved This Week",
    value: 2840,
    suffix: "+",
    icon: BoltIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
];

export function LiveMetrics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={containerRef}
      className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 overflow-hidden"
      aria-label="Live metrics"
    >
      {/* Background effects */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/30 dark:bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Real-time metrics
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            See what your team is achieving
          </h2>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl overflow-hidden">
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
              </div>

              <div className="relative p-5 lg:p-6">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl ${metric.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <metric.icon className={`w-5 h-5 ${metric.textColor}`} />
                </div>

                {/* Value */}
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                  {isInView && (
                    <AnimatedNumber
                      value={metric.value}
                      suffix={metric.suffix}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {metric.label}
                </div>
              </div>

              {/* Animated border gradient */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                style={{ transform: "scale(1.05)" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
