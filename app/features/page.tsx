import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { UsersIcon, Squares2X2Icon, ChartBarIcon, CheckIcon, BuildingOffice2Icon, BoltIcon, ShieldCheckIcon, ClockIcon, ArrowsRightLeftIcon, CubeTransparentIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Features | Flux',
  description: 'Powerful features for modern teams. Kanban boards, AI planning, analytics, and team collaboration to help your team ship faster.',
};

const features = [
  {
    icon: UsersIcon,
    title: 'Real-time Collaboration',
    description: 'See who\'s working on what. Member avatars, instant task updates, and a live activity feed keep everyone aligned.',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Squares2X2Icon,
    title: 'Kanban Boards',
    description: 'Visualize your workflow with flexible Kanban boards. Drag and drop tasks, customize columns, and optimize your process.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    icon: SparklesIcon,
    title: 'Plan with AI',
    description: 'Describe a project and Flux generates structured boards, tasks, and subtasks in seconds. Decompose any task with one click.',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    description: 'Track completion rates, task status breakdowns, and productivity metrics with clear, actionable visualizations.',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  {
    icon: CheckIcon,
    title: 'Task Management',
    description: 'Subtasks, priorities, assignees, due dates, labels, comments, and threaded replies to fit how your team works.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: BuildingOffice2Icon,
    title: 'Team Workspaces',
    description: 'Organize teams with dedicated workspaces. Control access, set permissions, and manage multiple teams effortlessly.',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
];

const additionalFeatures = [
  {
    icon: CubeTransparentIcon,
    title: 'REST API & Webhooks',
    description: 'Build on Flux with a versioned REST API, scoped API keys, and signed webhook events.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Roles & Permissions',
    description: 'Admin, Editor, and Viewer roles with per-board access control and audit logging.',
  },
  {
    icon: UserCircleIcon,
    title: 'Secure Sign-In',
    description: 'One-click Google sign-in, email verification, and account protection with login lockout.',
  },
  {
    icon: BoltIcon,
    title: 'Calendar & Archive',
    description: 'See tasks by due date on the calendar, and restore completed work from the archive anytime.',
  },
];

const comingSoon = [
  {
    icon: ArrowsRightLeftIcon,
    title: 'Integrations',
    description: 'Connect Slack, GitHub, Google Workspace, and more to keep your stack in sync.',
  },
  {
    icon: ClockIcon,
    title: 'Time Tracking',
    description: 'Track time on tasks to monitor productivity and bill accurately.',
  },
  {
    icon: BoltIcon,
    title: 'Workflow Automation',
    description: 'Automate repetitive work with custom triggers and actions.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'SSO & SAML',
    description: 'Enterprise single sign-on for centralized access management.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/features" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] mb-6 tracking-tight">
              Powerful Features for Modern Teams
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              Everything you need to ship faster, collaborate better, and build the future together.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border-subtle)] p-8 shadow-sm hover:shadow-premium transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] text-center mb-12">
              Even more ways to boost productivity
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-[var(--radius)] bg-[var(--surface-subtle)] p-6 border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] transition-all duration-300"
                >
                  <feature.icon className="w-5 h-5 text-[var(--brand-primary)] mb-4" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] text-center mb-3">
              On the roadmap
            </h2>
            <p className="text-center text-[var(--text-secondary)] mb-12">
              Features we&apos;re actively building. Want one sooner? <Link href="/contact" className="text-[var(--brand-primary)] font-semibold hover:underline">Let us know.</Link>
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comingSoon.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-[var(--radius)] bg-[var(--surface-subtle)] p-6 border border-dashed border-[var(--border-subtle)]"
                >
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2 py-1 rounded-full">
                    Coming soon
                  </span>
                  <feature.icon className="w-5 h-5 text-[var(--text-secondary)] mb-4" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-6">
              Ready to experience these features?
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
              Start your free trial today and see how Flux can transform your team&apos;s workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-[var(--surface)] text-[var(--foreground)] rounded-xl font-bold hover:bg-[var(--surface-subtle)] transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-[var(--surface-subtle)] text-[var(--foreground)] rounded-xl font-bold hover:bg-[var(--surface)] transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
