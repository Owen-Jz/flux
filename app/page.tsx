"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';

// Import new enhanced components
import { HeroSection } from '@/components/landing/hero-section';
import { HeroPreviewSection } from '@/components/landing/hero-preview';
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
import { ThemeToggle } from '@/components/theme-toggle';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'glass border-b border-[var(--border-subtle)]'
          : 'bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <span className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">flux</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle - Desktop */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
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
            className="lg:hidden border-t border-[var(--border-subtle)] py-4"
          >
            {/* Theme Toggle - Mobile */}
            <div className="mb-4">
              <ThemeToggle />
            </div>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-base font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            {!isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-3">
                <Link
                  href="/login"
                  className="block text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl text-sm font-semibold hover:opacity-90 transition-colors text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get started free
                </Link>
              </div>
            )}
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
    <footer className="bg-[var(--background)] pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)]" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6 md:gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <span className="font-black text-2xl tracking-tight text-[var(--text-primary)]">flux</span>
            </Link>
            <p className="text-[var(--text-tertiary)] max-w-xs mb-6 leading-relaxed">
              The all-in-one workspace for high-performing engineering teams to ship faster.
            </p>
            <div className="flex gap-3">
              {/* Social icons would go here */}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-[var(--text-primary)] mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
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
      <div className="min-h-screen bg-[var(--background)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-[var(--text-inverse)]">
        {/* Noise overlay for texture */}
        <div className="fixed inset-0 noise opacity-[0.015] dark:opacity-[0.03] pointer-events-none z-[100]" aria-hidden="true" />

        <Navigation />

        <main>
          {/* Hero Section - New enhanced version */}
          <HeroSection />

          {/* Hero Preview Section - Kanban animation that appears after hero */}
          <HeroPreviewSection />

          {/* Social Proof - Trusted by */}
          <section className="py-12 lg:py-16 bg-[var(--background-subtle)] border-b border-[var(--border-subtle)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-8">
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
          <section id="features" className="py-16 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-3xl mb-10 md:mb-16">
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                  Features
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4 md:mb-6">
                  Built for modern teams
                </h2>
                <p className="text-base md:text-lg text-[var(--text-secondary)]">
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
