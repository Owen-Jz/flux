import Link from 'next/link';
import { ArrowRight, CheckCheck, Star } from 'lucide-react';
import { HeroAnimation } from '@/components/landing/hero-animation';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { LandingPageAnimation } from '@/components/landing/scroll-animation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--brand-primary)] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src="/icon.svg" alt="Flux Logo" className="relative w-8 h-8 rounded-lg transform group-hover:scale-105 transition-transform" />
            </div>
            <span className="font-bold text-xl tracking-tight">Flux</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">Pricing</a>
            <a href="#about" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary text-sm shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/40 transition-shadow">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-[var(--background)] to-[var(--background)] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--brand-primary)] mb-8 animate-fade-in shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-primary)]"></span>
              </span>
              v2.0 is live: Real-time Collaboration
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-[var(--foreground)] leading-[1.1] mb-6 tracking-tight">
              Manage chaos
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-purple-500 to-pink-500 animate-gradient-x bg-300%">
                build the future
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Flux is the intelligent workspace that adapts to your team's workflow.
              Stop fighting your tools and start shipping software.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/signup" className="btn btn-primary text-base px-8 py-4 w-full sm:w-auto shadow-xl shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/40 hover:-translate-y-0.5 transition-all">
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/demo"
                className="btn btn-secondary text-base px-8 py-4 w-full sm:w-auto hover:bg-[var(--surface)] transition-colors"
              >
                View interactive demo
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-[var(--text-secondary)] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {/* Tech Logos Placeholders */}
              <div className="h-8 w-24 bg-current/10 rounded animate-pulse" />
              <div className="h-8 w-24 bg-current/10 rounded animate-pulse" />
              <div className="h-8 w-24 bg-current/10 rounded animate-pulse" />
            </div>
          </div>

          <div className="relative lg:h-[600px] flex items-center justify-center">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-10 border-y border-[var(--border-subtle)] bg-[var(--surface)]/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24">
          {[
            { label: "Active Users", value: "10k+" },
            { label: "Tasks Completed", value: "1.2m+" },
            { label: "Uptime", value: "99.99%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-[var(--foreground)] mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--text-secondary)] font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[var(--surface)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-4">Features</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
              Everything you need to ship.
            </h3>
            <p className="text-xl text-[var(--text-secondary)]">
              Powerful features packaged in a simple, intuitive interface that your team will actually love using.
            </p>
          </div>

          <FeaturesGrid />
        </div>
      </section>

      {/* Scroll Animation / Product Showcase */}
      <LandingPageAnimation />

      {/* Testimonial */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-3xl md:text-5xl font-medium text-[var(--foreground)] mb-10 leading-tight">
            &ldquo;Flux transformed how we build software. It's not just a tool, it's a productivity multiplier for our entire engineering team.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200" /> {/* Placeholder Avatar */}
            <div className="text-left">
              <div className="font-bold text-[var(--foreground)]">Sarah Jenkins</div>
              <div className="text-sm text-[var(--text-secondary)]">CTO at TechFlow</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--brand-primary)] -z-20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 -z-10" />

        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to streamline your workflow?</h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of high-performing teams who rely on Flux to deliver quality software on time.
          </p>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-400/20 text-green-300">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <span className="font-medium">Free forever plan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-400/20 text-green-300">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-400/20 text-green-300">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn bg-white text-[var(--brand-primary)] hover:bg-gray-100 text-base px-10 py-4 w-full sm:w-auto font-bold shadow-xl">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground)]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="/icon.svg" alt="Flux Logo" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-xl">Flux</span>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">
                Making project management effortless for modern software teams.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholder */}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-[var(--text-secondary)] text-sm">
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Features</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Integrations</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Pricing</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-[var(--text-secondary)] text-sm">
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">About</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Careers</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Blog</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Legal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-[var(--text-secondary)] text-sm">
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Help Center</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Community</Link></li>
                <li><Link href="#" className="hover:text-[var(--brand-primary)]">Contact Status</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-[var(--text-secondary)]">
              © 2026 Flux Inc. All rights reserved.
            </span>
            <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
              <Link href="#" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
              <Link href="#" className="hover:text-[var(--foreground)]">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
