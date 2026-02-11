"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCheck, Star } from 'lucide-react';
import { HeroAnimation } from '@/components/landing/hero-animation';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { LandingPageAnimation } from '@/components/landing/scroll-animation';
import { LogoMarquee } from '@/components/landing/logo-marquee';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-white">
      {/* Universal Noise Overlay for Premium Feel */}
      <div className="fixed inset-0 noise opacity-[0.015] pointer-events-none z-[100]" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--brand-primary)] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src="/icon.svg" alt="Flux Logo" className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl transform group-hover:scale-105 transition-transform shadow-sm" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter text-[var(--foreground)]">flux</span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {["Features", "Design", "Pricing", "Enterprise"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-all duration-300 hover:translate-y-[-1px]"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-bold text-[var(--foreground)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Log in
            </Link>
            <Link href="/signup" className="group relative px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-2">
                Join Flux
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 grid-pattern opacity-10 -z-10" />

        {/* Ambient Glows (Very subtle, wide blur) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-20" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-[var(--border-subtle)] text-xs font-bold text-slate-800 mb-10 shadow-premium"
          >
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] uppercase tracking-widest">New</span>
            Flux 2.0: The Future of Collaboration is here
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-[var(--foreground)] leading-[1.05] mb-8 tracking-tight max-w-5xl"
          >
            Move fast.
            <br />
            <span className="relative inline-block">
              Stay in <span className="text-indigo-600 italic">flow.</span>
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-indigo-100 -rotate-1 -z-10" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mb-12 leading-relaxed"
          >
            Flux is the high-performance workspace where teams collaborate in real-time, ship quality software, and build the future together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link href="/signup" className="h-16 px-10 bg-indigo-600 text-white rounded-2xl text-lg font-extrabold shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:bg-indigo-700 transition-all flex items-center group">
              Get started for free
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/demo" className="h-16 px-10 bg-white border border-[var(--border-subtle)] text-[var(--foreground)] rounded-2xl text-lg font-bold hover:bg-slate-50 transition-colors flex items-center">
              Request a demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-24 w-full max-w-6xl relative"
          >
            {/* Ambient Background Glow behind component */}
            <div className="absolute inset-x-20 -bottom-20 h-40 bg-indigo-400/20 blur-[100px] rounded-full -z-10" />
            <HeroAnimation />
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Trusted By */}
      <section className="py-24 relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Trusted by teams at the world's most innovative companies</p>
          <LogoMarquee />
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="py-32 px-6 relative bg-slate-50/30 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-24">
            <h2 className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-6 px-1">Platform</h2>
            <h3 className="text-4xl md:text-6xl font-black text-[var(--foreground)] tracking-tight leading-tight">
              Everything you need to scale your team.
            </h3>
          </div>

          <FeaturesGrid />
        </div>
      </section>

      {/* Product Deep Dive Section */}
      <LandingPageAnimation />

      {/* Stats Section */}
      <section className="py-32 px-6 bg-slate-900 relative overflow-hidden">
        <div className="noise opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {[
            { label: "Daily Active Users", value: "240k+" },
            { label: "Pull Requests", value: "1.2m" },
            { label: "API Uptime", value: "99.999%" },
            { label: "Velocity Increase", value: "+40%" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">{stat.value}</div>
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden bg-slate-900">
        {/* Background Animation & Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent)] -z-10" />
        <div className="noise opacity-20 -z-0" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            Ready to ship?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 mb-16 max-w-2xl mx-auto font-medium"
          >
            Join 20,000+ teams using Flux to build the software of tomorrow. No credit card required, set up in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-white/10 shadow-2xl mb-16"
          >
            <div className="grid md:grid-cols-3 gap-8 mb-12 text-left">
              {[
                "Free forever for individuals",
                "No credit card required",
                "Unlimited public boards"
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/signup" className="h-16 px-12 bg-white text-slate-950 rounded-2xl text-lg font-black shadow-2xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 flex items-center group w-full sm:w-auto justify-center">
                Start Building Now
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/demo" className="h-16 px-12 bg-slate-800 border border-slate-700 text-white rounded-2xl text-lg font-bold hover:bg-slate-700 transition-all flex items-center w-full sm:w-auto justify-center">
                Watch Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Elevated Footer */}
      <footer className="bg-white pt-24 pb-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <img src="/icon.svg" alt="Flux Logo" className="w-10 h-10 rounded-xl" />
                <span className="font-black text-2xl tracking-tighter">flux</span>
              </div>
              <p className="text-slate-500 max-w-xs mb-8 font-medium leading-relaxed">
                The high-performance workspace for the world's most innovative engineering teams.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer">
                  <div className="w-5 h-5 bg-slate-400 rounded-sm" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer">
                  <div className="w-5 h-5 bg-slate-400 rounded-sm" />
                </div>
              </div>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "Roadmap"] },
              { title: "Resources", links: ["Documentation", "Help Center", "Community", "API Reference"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Legal"] }
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-extrabold text-sm uppercase tracking-widest mb-8 text-slate-900">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(link => (
                    <li key={link}>
                      <Link href="#" className="text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-slate-400 text-sm font-bold">
              © 2026 Flux Technologies Inc. Built for the future.
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-400">
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
