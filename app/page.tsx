import Link from 'next/link';
import { ArrowRight, Zap, Users, Lock, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Flux</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary text-sm">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] mb-6">
            <Zap className="w-4 h-4 text-[var(--brand-primary)]" />
            Now with real-time collaboration
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--foreground)] leading-tight mb-6">
            Project management
            <br />
            <span className="text-[var(--brand-primary)]">that moves</span> with you
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Flux is a cutting-edge project management platform with lightning-fast
            Kanban boards, real-time collaboration, and elegant public sharing.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn btn-primary text-base px-8 py-3">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="btn btn-secondary text-base px-8 py-3"
            >
              View demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to ship faster
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6 bg-[var(--background)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[var(--brand-primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Optimistic updates mean your changes appear instantly. No waiting
                for the server.
              </p>
            </div>
            <div className="card p-6 bg-[var(--background)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[var(--brand-primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Team Collaboration</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Invite your team, assign tasks, and work together in real-time
                with role-based access.
              </p>
            </div>
            <div className="card p-6 bg-[var(--background)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-[var(--brand-primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Public Sharing</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Share your board publicly with a single click. Perfect for
                open-source projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join thousands of teams already using Flux to ship faster.
          </p>
          <Link href="/signup" className="btn btn-primary text-base px-8 py-3">
            Create your workspace
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--brand-primary)] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              © 2026 Flux. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <Lock className="w-4 h-4" />
            Secure by design
          </div>
        </div>
      </footer>
    </div>
  );
}
