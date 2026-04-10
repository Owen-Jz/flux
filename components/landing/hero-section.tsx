"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon, PlayIcon } from "@heroicons/react/24/outline";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15
    }
  }
};

// Static gradient orbs - no blur, uses opacity layering instead
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Light mode - opacity layering instead of blur */}
      <div className="absolute top-1/4 left-1/4 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-gradient-to-br from-[var(--brand-primary)]/30 via-[var(--info-primary)]/15 to-transparent rounded-full" />
      <div className="absolute top-1/2 right-1/4 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-gradient-to-bl from-[var(--info-primary)]/25 via-[var(--brand-secondary)]/15 to-transparent rounded-full" />
      <div className="absolute bottom-1/4 left-1/3 w-[min(400px,60vw)] h-[min(400px,60vw)] bg-gradient-to-tr from-[var(--brand-secondary)]/25 via-[var(--brand-primary)]/15 to-transparent rounded-full" />
      {/* Dark mode - slightly more opacity */}
      <div className="absolute top-1/4 left-1/4 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-gradient-to-br from-[var(--brand-primary)]/25 via-[var(--info-primary)]/20 to-transparent rounded-full hidden dark:block" />
      <div className="absolute top-1/2 right-1/4 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-gradient-to-bl from-[var(--info-primary)]/30 via-[var(--brand-secondary)]/15 to-transparent rounded-full hidden dark:block" />
      <div className="absolute bottom-1/4 left-1/3 w-[min(400px,60vw)] h-[min(400px,60vw)] bg-gradient-to-tr from-[var(--brand-secondary)]/25 via-[var(--brand-primary)]/20 to-transparent rounded-full hidden dark:block" />
    </div>
  );
}

// Grid pattern overlay
function GridPattern() {
  return (
    <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
      <svg className="w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// Simplified animated text - reduces per-word spans, removes 3D rotateX
function AnimatedText({ text, className, delay = 0, animateWords = true }: { text: string; className?: string; delay?: number; animateWords?: boolean }) {
  const words = text.split(" ");

  if (!animateWords) {
    // Single span with opacity-only animation for secondary lines
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        className={className}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.05,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Main Hero Section
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    if (!containerRef.current || !heroContentRef.current) return;

    const ctx = gsap.context(() => {
      // Create the pinned scroll trigger
      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=100%", // Pin for the height of the viewport
        pin: true,
        pinSpacing: false, // Don't add spacing, let content flow over
        scrub: 1, // Smooth scrubbing with 1 second lag
        onUpdate: (self) => {
          // Fade out the hero content as we scroll
          const progress = self.progress;
          gsap.to(heroContentRef.current, {
            opacity: 1 - progress,
            scale: 1 - progress * 0.1,
            y: -progress * 50,
            ease: "power2.out",
            duration: 0.1
          });
        }
      });

      return () => {
        scrollTriggerInstance.kill();
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen overflow-hidden bg-[var(--background)]"
      aria-labelledby="hero-heading"
    >
      <GradientOrbs />
      <GridPattern />

      <div ref={heroContentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex flex-col">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center text-center flex-1 justify-center pt-20 lg:pt-24 pb-12 lg:pb-16"
        >
          {/* Trust badge with pulse animation */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Link
              href="#changelog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)]/80 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)] transition-all backdrop-blur-xl group"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] hero-pulse" />
                <span className="text-[var(--brand-primary)]">New</span>
              </span>
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">Flux 2.0 is now available</span>
              <motion.svg
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-3 h-3 text-[var(--text-tertiary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </Link>
          </motion.div>

          {/* Main headline with 3D effect */}
          <motion.h1
            id="hero-heading"
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[var(--text-primary)] leading-[1.02] mb-8 tracking-tight max-w-5xl perspective-1000"
          >
            <AnimatedText text="Ship faster with" delay={0.1} animateWords={true} />
            <br />
            <span className="relative inline-block">
              <AnimatedText text="your team in flow" delay={0.6} animateWords={false} />
              <svg className="absolute -bottom-3 left-0 w-full h-5 text-[var(--brand-primary)]/30 -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M2 15 Q 50 5 100 12 T 198 10" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed"
          >
            The all-in-one workspace where engineering teams collaborate in real-time,
            automate workflows, and deliver quality software—without the chaos.
          </motion.p>

          {/* CTA buttons with enhanced hover effects */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 mb-12"
          >
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary)] text-[var(--text-inverse)] rounded-2xl text-base font-extrabold shadow-xl shadow-[var(--brand-primary)]/25 hover:shadow-2xl hover:shadow-[var(--brand-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
              />
              <span className="relative flex items-center gap-2">
                Start your free trial
                <span className="hero-arrow-bounce">
                  <ArrowRightIcon className="w-5 h-5" />
                </span>
              </span>
            </Link>

            <Link
              href="#demo"
              className="group px-8 py-4 bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-2xl text-base font-bold hover:bg-[var(--background-subtle)] hover:border-[var(--border-default)] transition-all flex items-center gap-2 backdrop-blur-xl"
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PlayIcon className="w-5 h-5 text-[var(--info-primary)]" />
              </motion.span>
              Watch demo
            </Link>
          </motion.div>

          {/* Social proof with animations */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
              <div className="flex -space-x-3">
                {[
                  { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", alt: "Team member 1" },
                  { img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", alt: "Team member 2" },
                  { img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", alt: "Team member 3" },
                  { img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face", alt: "Team member 4" },
                  { img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face", alt: "Team member 5" },
                ].map((person, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className="w-10 h-10 rounded-full border-3 border-[var(--surface)] overflow-hidden cursor-pointer shadow-md"
                  >
                    <Image
                      src={person.img}
                      alt={person.alt}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              <span className="font-medium">Join <strong className="text-[var(--text-secondary)]">24,000+</strong> teams</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star, i) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                >
                  <svg className="w-5 h-5 text-[var(--warning-primary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="ml-2 text-sm font-semibold text-[var(--text-tertiary)]"
              >
                4.9/5 from 2,400+ reviews
              </motion.span>
            </div>
          </motion.div>

          {/* Scroll indicator at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]"
            >
              <span className="text-xs font-medium uppercase tracking-widest">Scroll to explore</span>
              <div className="w-6 h-10 rounded-full border-2 border-[var(--border-default)] flex items-start justify-center p-1">
                <motion.div
                  animate={{ y: [0, 16, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
