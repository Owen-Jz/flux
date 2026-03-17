import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { RocketLaunchIcon, UsersIcon, ChartBarIcon, ArrowRightIcon, CheckCircleIcon, BoltIcon, ShieldCheckIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'How It Works | Flux',
  description: 'See how Flux helps your team ship faster with real-time collaboration, powerful workflows, and actionable insights.',
};

const steps = [
  {
    step: '01',
    title: 'Create Your Workspace',
    description: 'Set up your team workspace in seconds. Invite team members, create your first project, and start organizing tasks your way.',
    icon: RocketLaunchIcon,
  },
  {
    step: '02',
    title: 'Build Your Workflow',
    description: 'Customize Kanban boards, create task lists, or use a hybrid approach. Define columns, priorities, and automation rules that match your process.',
    icon: UsersIcon,
  },
  {
    step: '03',
    title: 'Collaborate in Real-Time',
    description: 'See updates instantly as they happen. Comment on tasks, share files, and keep everyone aligned without endless meetings.',
    icon: ChartBarIcon,
  },
];

const benefits = [
  {
    icon: BoltIcon,
    title: 'Lightning Fast',
    description: 'Every interaction happens in under 50ms. No waiting, no refreshing—just instant updates.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Enterprise Secure',
    description: 'Bank-grade encryption, SSO support, and granular permissions keep your data safe.',
  },
  {
    icon: ClockIcon,
    title: 'Save 10+ Hours/Week',
    description: 'Automate repetitive tasks, streamline approvals, and eliminate context switching.',
  },
  {
    icon: CheckCircleIcon,
    title: '100% Transparent',
    description: 'Real-time dashboards show exactly what\'s happening across all your projects.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/how-it-works" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Ship Faster, Together
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed mb-10">
              Flux brings your team together with real-time collaboration, powerful workflows, and insights that actually matter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all inline-flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white text-center mb-16">
              How Flux Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((item, index) => (
                <div key={item.step} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
                  )}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white mb-6 shadow-lg shadow-purple-500/25">
                      <item.icon className="w-9 h-9" />
                    </div>
                    <span className="text-6xl font-black text-[var(--border-subtle)] dark:text-slate-800 absolute top-0 left-1/2 -translate-x-1/2 -z-10">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-[var(--foreground)] dark:text-white mb-3 mt-4">
                      {item.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white text-center mb-6">
              Why Teams Love Flux
            </h2>
            <p className="text-center text-[var(--text-secondary)] dark:text-slate-400 max-w-2xl mx-auto mb-12">
              Thousands of teams have transformed their workflow with Flux. Here's what makes the difference.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="p-6 rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[var(--foreground)] dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <div className="mb-24">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium text-[var(--foreground)] dark:text-white mb-6">
                "Flux transformed how our engineering team collaborates. We've cut our meeting time in half and ship features 40% faster."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div className="text-left">
                  <div className="font-bold text-[var(--foreground)] dark:text-white">Sarah Kim</div>
                  <div className="text-sm text-[var(--text-secondary)] dark:text-slate-400">VP of Engineering, TechCorp</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white mb-6">
              Ready to transform your workflow?
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of teams already shipping faster with Flux. Start your free 14-day trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/features"
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
