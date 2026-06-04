"use client";

import Link from 'next/link';

// Landing page sections — AI project planner positioning
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { ValueProposition } from '@/components/landing/value-proposition';
import { WhoItsForSection } from '@/components/landing/who-its-for-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';
import { SmoothScroll } from '@/components/landing/smooth-scroll';
import { LandingNavbar } from '@/components/landing/navbar';

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
              <svg width="32" height="32" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
              </svg>
              <span className="font-black text-2xl tracking-tight text-[var(--text-primary)]">flux</span>
            </Link>
            <p className="text-[var(--text-tertiary)] max-w-xs mb-6 leading-relaxed">
              Describe your project. Flux plans it.
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

        <LandingNavbar />

        <main>
          {/* Hero — the whole pitch, with live AI planning demo */}
          <HeroSection />

          {/* How it works — Describe / Review / Done */}
          <HowItWorksSection />

          {/* Why Flux — three AI-planning benefits */}
          <ValueProposition />

          {/* Who it's for — freelancers, indie builders, small teams */}
          <WhoItsForSection />

          {/* Pricing */}
          <section id="pricing">
            <PricingSection />
          </section>

          {/* FAQ */}
          <FAQSection />

          {/* Footer CTA */}
          <CTASection />
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}
