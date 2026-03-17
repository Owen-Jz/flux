"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';

// Import new enhanced components
import { HeroSection } from '@/components/landing/hero-section';
import { StatsSection } from '@/components/landing/stats-section';
import { ValueProposition } from '@/components/landing/value-proposition';
import { CTASection } from '@/components/landing/cta-section';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { LandingPageAnimation } from '@/components/landing/scroll-animation';
import { LogoMarquee } from '@/components/landing/logo-marquee';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { AnalyticsDashboard } from '@/components/landing/analytics-dashboard';
import { LiveMetrics } from '@/components/landing/live-metrics';
import { SmoothScroll } from '@/components/landing/smooth-scroll';

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoggedIn = status === 'authenticated' && session?.user;

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50'
          : 'bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <img
              src="/icon.svg"
              alt=""
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
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
            className="lg:hidden border-t border-slate-200 dark:border-slate-800 py-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-base font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white"
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

// Footer Component
function Footer() {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
    Resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'Community', href: '/community' },
      { label: 'Blog', href: '/blog' },
      { label: 'Webinars', href: '/webinars' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ],
  };

  return (
    <footer className="bg-white dark:bg-slate-950 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
              <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
              The all-in-one workspace for high-performing engineering teams to ship faster.
            </p>
            <div className="flex gap-3">
              {/* Social icons would go here */}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
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
    <SmoothScroll>
      <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden selection:bg-purple-500 selection:text-white">
        {/* Noise overlay for texture */}
        <div className="fixed inset-0 noise opacity-[0.015] dark:opacity-[0.03] pointer-events-none z-[100]" aria-hidden="true" />

        <Navigation />

        <main>
          {/* Hero Section - New enhanced version */}
          <HeroSection />

          {/* Social Proof - Trusted by */}
          <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-8">
                Trusted by industry leaders
              </p>
              <LogoMarquee />
            </div>
          </section>

          {/* Live Metrics Ticker */}
          <LiveMetrics />

          {/* Stats Section - New enhanced version */}
          <StatsSection />

          {/* Value Proposition - New enhanced version */}
          <ValueProposition />

          {/* Analytics Dashboard */}
          <AnalyticsDashboard />

          {/* Features */}
          <section id="features" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-3xl mb-16">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Features
                </span>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                  Built for modern teams
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
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

          {/* CTA - New enhanced version */}
          <CTASection />
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
