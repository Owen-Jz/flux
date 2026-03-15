"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCheck, Star, Zap, Shield, Users, TrendingUp, BarChart3, Globe, Headphones, Play, Quote, X, Menu, ChevronDown, Check } from 'lucide-react';
import { HeroAnimation } from '@/components/landing/hero-animation';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { LandingPageAnimation } from '@/components/landing/scroll-animation';
import { LogoMarquee } from '@/components/landing/logo-marquee';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';

// Animation variants - preserved from original
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Micro-interaction variants for dopamine response
const microInteraction = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

// Navigation Component - Light mode only
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Neuromarketing: Minimal navigation to reduce cognitive load
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo - Trust signal */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <img
                src="/icon.svg"
                alt=""
                className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">flux</span>
          </Link>

          {/* Desktop Nav - Simplified for cognitive load reduction */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Right Side - Action-focused */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>

            {/* Primary CTA - Green for action (neuromarketing principle) */}
            <Link
              href="/signup"
              {...microInteraction}
              className="group relative px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:bg-emerald-600 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Get started free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-200 py-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-base font-semibold text-slate-600 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  );
}

// Hero Section - Optimized for F-pattern reading and conversion
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background Effects - Subtle blue for trust */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-50/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-emerald-50/30 rounded-full blur-[80px]" />
        <div className="absolute inset-0 grid-pattern opacity-[0.03]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center text-center"
        >
          {/* Trust Badge - Immediate credibility */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Link
              href="#changelog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-blue-300 transition-colors shadow-sm"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-blue-600">New</span>
              </span>
              <span className="text-slate-500">Flux 2.0 is now available</span>
              <ChevronDown className="w-3 h-3 rotate-[-90deg] text-slate-400" />
            </Link>
          </motion.div>

          {/* Main Headline - Action-oriented, benefit-focused */}
          <motion.h1
            id="hero-heading"
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight max-w-5xl"
          >
            Ship faster with
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                your team in flow
              </span>
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-blue-200 -z-10" viewBox="0 0 200 16" preserveAspectRatio="none">
                <path d="M2 12 Q 50 2 100 10 T 198 8" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </motion.h1>

          {/* Subheadline - Benefit-focused with optimal line length (50-75 chars) */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed"
          >
            The all-in-one workspace where engineering teams collaborate in real-time,
            automate workflows, and deliver quality software—without the chaos.
          </motion.p>

          {/* CTA Buttons - Green for action, high contrast */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            {/* Primary CTA - Green (action color per neuromarketing) */}
            <Link
              href="/signup"
              {...microInteraction}
              className="group relative px-8 py-4 bg-emerald-500 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 hover:bg-emerald-600 transition-all flex items-center"
            >
              <span className="flex items-center gap-2">
                Start your free trial
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            {/* Secondary CTA - Blue (trust color) */}
            <Link
              href="#demo"
              className="group px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-base font-bold hover:bg-slate-50 hover:border-blue-300 transition-colors flex items-center gap-2"
            >
              <Play className="w-5 h-5 text-blue-600" />
              Watch demo
            </Link>
          </motion.div>

          {/* Social Proof - Critical for conversion, placed above fold */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="font-medium">Join <strong className="text-slate-900">24,000+</strong> teams</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm font-semibold text-slate-700">4.9/5 from 2,400+ reviews</span>
            </div>
          </motion.div>

          {/* Hero Image - Lazy loaded */}
          <motion.div
            style={{ y, opacity }}
            className="mt-16 lg:mt-24 w-full max-w-6xl relative"
          >
            <div className="absolute inset-x-10 -bottom-20 h-40 bg-blue-400/20 blur-[80px] rounded-full -z-10" />
            <HeroAnimation />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Stats Section - Credibility builder with blue trust colors
function StatsSection() {
  const stats = [
    { label: 'Daily Active Users', value: '240k+', icon: Users },
    { label: 'Tasks Completed', value: '12M+', icon: CheckCheck },
    { label: 'Uptime SLA', value: '99.999%', icon: Shield },
    { label: 'Time Saved/Week', value: '8hrs', icon: Zap },
  ];

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden" aria-label="Platform statistics">
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Value Proposition Section - Cognitive load reduction
function ValueProposition() {
  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second response times with real-time sync across all devices. No more waiting for page loads.',
    },
    {
      icon: Users,
      title: 'Built for Teams',
      description: 'Seamless collaboration with comments, mentions, and activity feeds that keep everyone aligned.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 Type II certified with SSO, RBAC, and end-to-end encryption. Your data stays safe.',
    },
    {
      icon: BarChart3,
      title: 'Actionable Insights',
      description: 'Powerful analytics that surface bottlenecks and help you make data-driven decisions.',
    },
  ];

  return (
    <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="value-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
            Why Flux
          </span>
          <h2 id="value-heading" className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Everything you need to ship faster
          </h2>
          <p className="text-lg text-slate-600">
            Stop juggling multiple tools. Flux consolidates your workflow into one powerful platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="p-6 lg:p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section - High contrast green for action
function CTASection() {
  return (
    <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden" aria-labelledby="cta-heading">
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-emerald-900/20" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 id="cta-heading" className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to transform your workflow?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of high-performing teams who rely on Flux to ship faster.
            No credit card required. Setup in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA - Green for action */}
            <Link
              href="/signup"
              {...microInteraction}
              className="group px-8 py-4 bg-emerald-500 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              Start your free trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#contact"
              className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl text-base font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              Contact sales
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Free for teams up to 5 members. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Footer Component - Simplified
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Integrations', 'Roadmap', 'Changelog'],
    Resources: ['Documentation', 'API Reference', 'Community', 'Blog', 'Webinars'],
    Company: ['About', 'Careers', 'Press', 'Partners', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Security', 'Cookies', 'Licenses'],
  };

  return (
    <footer className="bg-white pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
              <span className="font-black text-2xl tracking-tight text-slate-900">flux</span>
            </Link>
            <p className="text-slate-500 max-w-xs mb-6 leading-relaxed">
              The all-in-one workspace for high-performing engineering teams to ship faster.
            </p>
            <div className="flex gap-3">
              {/* Social icons would go here */}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-slate-900 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Noise overlay for texture */}
      <div className="fixed inset-0 noise opacity-[0.015] pointer-events-none z-[100]" aria-hidden="true" />

      <Navigation />

      <main>
        <HeroSection />

        {/* Social Proof - Trusted by */}
        <section className="py-12 lg:py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
              Trusted by industry leaders
            </p>
            <LogoMarquee />
          </div>
        </section>

        <StatsSection />

        <ValueProposition />

        {/* Features */}
        <section id="features" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
                Features
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
                Built for modern teams
              </h2>
              <p className="text-lg text-slate-600">
                Every feature designed with performance and usability in mind.
              </p>
            </div>
            <FeaturesGrid />
          </div>
        </section>

        {/* How it works */}
        <LandingPageAnimation />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Pricing */}
        <section id="pricing">
          <PricingSection />
        </section>

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
