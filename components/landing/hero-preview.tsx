"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, MotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SparklesIcon, BoltIcon, ShieldCheckIcon, UsersIcon, CheckIcon, ClockIcon } from "@heroicons/react/24/outline";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Animated task card for the dashboard with enhanced details
function AnimatedTaskCard({ title, category, progress, delay, description, priority, assignees }: {
  title: string;
  category: string;
  progress?: number;
  delay: number;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignees?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  const priorityColors = {
    low: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-md dark:shadow-lg cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            category === 'Design' ? 'bg-orange-400' :
            category === 'Development' ? 'bg-purple-400' :
            category === 'Research' ? 'bg-green-400' : 'bg-blue-400'
          }`} />
          <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">{category}</span>
        </div>
        {priority && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2 }}
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${priorityColors[priority]}`}
          >
            {priority}
          </motion.span>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-purple-600 dark:group-hover:text-white transition-colors">{title}</div>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: delay + 0.1 }}
          className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 line-clamp-2"
        >
          {description}
        </motion.p>
      )}
      {assignees && assignees.length > 0 && (
        <div className="flex -space-x-1.5 mb-3">
          {assignees.map((initials, i) => (
            <motion.div
              key={initials}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.15 + (i * 0.05) }}
              className="w-5 h-5 rounded-full border border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5] }}
            >
              {initials}
            </motion.div>
          ))}
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

// Floating dashboard preview with enhanced parallax and animations
function FloatingDashboard({ scrollY }: { scrollY: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const y1 = useTransform(scrollY, (v) => v * 0.12);
  const y2 = useTransform(scrollY, (v) => v * 0.2);
  const y3 = useTransform(scrollY, (v) => v * 0.08);
  const rotate = useTransform(scrollY, (v) => v * 0.015);

  // Spring animation for smooth entrance
  const springY = useSpring(y3, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto mt-8 lg:mt-12 perspective-1500">
      {/* Background cards with parallax - floating around - Light mode */}
      <motion.div
        style={{ y: y1, rotate }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.5, x: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute -left-8 lg:-left-16 top-8 w-[200px] lg:w-[320px] hidden md:block"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-3/4 bg-slate-200 rounded" />
            <div className="h-2 w-1/2 bg-slate-100 rounded" />
            <div className="flex gap-2 mt-3">
              <div className="h-12 flex-1 bg-slate-50 rounded" />
              <div className="h-12 flex-1 bg-slate-50 rounded" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 0.4, x: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute -right-8 lg:-right-16 top-20 w-[180px] lg:w-[280px] hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xl"
        >
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100" />
                <div className="h-2 flex-1 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Main dashboard with enhanced entrance */}
      <motion.div
        ref={dashboardRef}
        style={{ y: springY }}
        initial={{ opacity: 0, y: 80, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{
          duration: 1.2,
          delay: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-2xl"
      >
        {/* Subtle border for light mode */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none border border-purple-500/10" />

        {/* Header - Light mode */}
        <div className="h-14 border-b border-slate-200 flex items-center px-6 gap-4 bg-white/80">
          <div className="flex gap-2">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]/80 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3.5 h-3.5 rounded-full bg-[#febc2e]/80 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3.5 h-3.5 rounded-full bg-[#28c840]/80 cursor-pointer"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 cursor-pointer transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Flux Board / Q4 Roadmap
          </motion.div>
        </div>

        {/* Content - Light mode with enhanced styling */}
        <div className="p-6 bg-gradient-to-b from-white to-slate-50 min-h-[400px] relative overflow-visible">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]" aria-hidden="true">
            <svg className="w-full h-full">
              <defs>
                <pattern id="dashboard-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dashboard-grid)" />
            </svg>
          </div>

          <div className="flex gap-6 relative z-10">
            {/* Sidebar - Light mode */}
            <div className="w-48 hidden lg:block space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspaces</div>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02 }}
                  className="h-10 w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl flex items-center px-3 text-sm font-semibold cursor-pointer shadow-lg shadow-purple-500/25"
                >
                  <BoltIcon className="w-4 h-4 mr-2" /> Product
                </motion.div>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  className="h-10 w-full bg-white hover:bg-slate-50 rounded-xl flex items-center px-3 text-sm text-slate-600 transition-all cursor-pointer border border-slate-200 shadow-sm"
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" /> Engineering
                </motion.div>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  className="h-10 w-full bg-white hover:bg-slate-50 rounded-xl flex items-center px-3 text-sm text-slate-600 transition-all cursor-pointer border border-slate-200 shadow-sm"
                >
                  <UsersIcon className="w-4 h-4 mr-2" /> Design
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team</div>
                <div className="flex -space-x-2">
                  {["JD", "SK", "MR", "AL"].map((initials, i) => (
                    <motion.div
                      key={initials}
                      whileHover={{ scale: 1.2, zIndex: 10, rotate: 5 }}
                      className="w-8 h-8 rounded-full border-3 border-white flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-md"
                      style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][i] }}
                    >
                      {initials}
                    </motion.div>
                  ))}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full border-3 border-white bg-slate-100 flex items-center justify-center text-xs text-slate-500 cursor-pointer shadow-sm"
                  >
                    +12
                  </motion.div>
                </div>
              </div>
            </div>

            {/* board */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl font-bold text-slate-800"
                >
                  Q4 Product Roadmap
                </motion.div>
                <div className="flex gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-sm flex items-center text-slate-600 font-medium cursor-pointer shadow-sm"
                  >
                    Filter
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 40px -10px rgba(139, 92, 246, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm flex items-center font-semibold shadow-lg shadow-purple-500/25 cursor-pointer"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1.5" /> New Task
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* To Do */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>To Do</span>
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-medium">5</span>
                  </div>
                  <AnimatedTaskCard
                    title="Design system audit"
                    category="Design"
                    delay={1}
                    description="Review and document all UI components for consistency"
                    priority="medium"
                    assignees={["JD", "AL"]}
                  />
                  <AnimatedTaskCard
                    title="API v2 integration"
                    category="Feature"
                    delay={1.1}
                    description="Implement new REST API endpoints for mobile app"
                    priority="high"
                    assignees={["SK", "MR"]}
                  />
                  <AnimatedTaskCard
                    title="Performance optimization"
                    category="Development"
                    delay={1.15}
                    description="Optimize database queries and add caching layer"
                    priority="low"
                    assignees={["JD"]}
                  />
                </div>

                {/* In Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>In Progress</span>
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">3</span>
                  </div>
                  <AnimatedTaskCard
                    title="Dashboard redesign"
                    category="Development"
                    progress={65}
                    delay={1.2}
                    description="Modernize the main dashboard with new charts and widgets"
                    priority="high"
                    assignees={["MR", "SK", "AL"]}
                  />
                  <AnimatedTaskCard
                    title="User authentication flow"
                    category="Feature"
                    progress={40}
                    delay={1.25}
                    description="Add OAuth2 support and two-factor authentication"
                    priority="medium"
                    assignees={["JD", "SK"]}
                  />
                  <AnimatedTaskCard
                    title="Mobile responsive layout"
                    category="Design"
                    progress={80}
                    delay={1.3}
                    description="Ensure all pages work seamlessly on mobile devices"
                    priority="low"
                    assignees={["AL"]}
                  />
                </div>

                {/* Done */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                    <span>Done</span>
                    <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded font-medium">9</span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 1.3 }}
                    className="p-4 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-[10px] font-medium text-purple-500 dark:text-purple-400 uppercase">Research</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 line-through mb-3">User interviews</div>
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5, type: "spring" }}
                        className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center"
                      >
                        <CheckIcon className="w-3 h-3 text-purple-400" />
                      </motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 1.35 }}
                    className="p-4 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase">Design</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 line-through mb-3">Wireframe prototypes</div>
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.55, type: "spring" }}
                        className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"
                      >
                        <CheckIcon className="w-3 h-3 text-green-400" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating notifications - Light mode */}
        <motion.div
          initial={{ x: 80, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05, x: 5 }}
          className="absolute -right-4 top-24 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xl flex items-center gap-3 z-20 cursor-pointer"
        >
          <div className="p-2 bg-purple-100 rounded-xl">
            <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700">Security audit passed</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" /> Just now
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: -60, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05, x: -5 }}
          className="absolute -left-4 bottom-24 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xl flex items-center gap-3 z-20 cursor-pointer"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
              SK
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700">Sarah commented</div>
            <div className="text-[10px] text-slate-400 max-w-[120px] truncate">"This looks amazing! 🔥"</div>
          </div>
        </motion.div>

        {/* Simple cursor */}
        <motion.div
          animate={{
            x: [280, 340, 280],
            y: [160, 120, 160],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 left-0 z-30 pointer-events-none"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z"
              fill="#0f172a"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Main Hero Preview Section - appears after the pinned hero text
export function HeroPreviewSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      // Fade in the background as the section comes into view
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
          });
        },
        once: true
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-white dark:bg-slate-950 overflow-hidden"
    >
      <div
        ref={contentRef}
        className="opacity-0 translate-y-8"
      >
        <FloatingDashboard scrollY={scrollY} />
      </div>
    </section>
  );
}
