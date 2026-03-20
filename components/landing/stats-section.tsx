"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { UsersIcon, CheckCircleIcon, ShieldCheckIcon, BoltIcon, ArrowTrendingUpIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

if (typeof window !== "undefined") {
  gsap.registerPlugin();
}

// Animated counter component
function AnimatedCounter({ value, suffix = "", prefix = "", duration = 2 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const obj = { value: 0 };
    gsap.to(obj, {
      value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        setCount(Math.floor(obj.value));
      }
    });
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Stats data
const stats = [
  { label: "Daily Active Users", value: 240000, suffix: "+", icon: UsersIcon, color: "from-blue-500 to-cyan-500" },
  { label: "Tasks Completed", value: 12000000, suffix: "+", icon: CheckCircleIcon, color: "from-purple-500 to-teal-500" },
  { label: "Uptime SLA", value: 99.999, suffix: "%", prefix: "", icon: ShieldCheckIcon, color: "from-purple-500 to-pink-500", isDecimal: true },
  { label: "Hours Saved/Week", value: 8, suffix: "hrs", icon: BoltIcon, color: "from-amber-500 to-orange-500" },
];

export function StatsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);

  return (
    <section
      ref={containerRef}
      className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] overflow-hidden"
      aria-label="Platform statistics"
    >
      {/* Background effects */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--brand-primary)]/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300">
                <stat.icon className={`w-5 h-5 md:w-7 md:h-7 bg-gradient-to-bg ${stat.color} bg-clip-text text-transparent`} />
              </div>
              <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] mb-1 md:mb-2 tracking-tight">
                {stat.isDecimal ? (
                  <span>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
                  </span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
                )}
              </div>
              <div className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
