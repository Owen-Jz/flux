import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { Users, LayoutDashboard, BarChart3, CheckSquare, Building2, Plug, Zap, Shield, Clock, Workflow } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features | Flux',
  description: 'Powerful features for modern teams. Real-time collaboration, Kanban boards, analytics, and more to help your team ship faster.',
};

const features = [
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'See who\'s working on what in real-time. Avatars, live cursors, and instant updates keep everyone synchronized.',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: LayoutDashboard,
    title: 'Kanban Boards',
    description: 'Visualize your workflow with flexible Kanban boards. Drag and drop tasks, customize columns, and optimize your process.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track team velocity, burndown charts, and productivity metrics with beautiful, actionable visualizations.',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Powerful task management with subtasks, dependencies, priorities, and custom fields to fit any workflow.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Building2,
    title: 'Team Workspaces',
    description: 'Organize teams with dedicated workspaces. Control access, set permissions, and manage multiple teams effortlessly.',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description: 'Connect with your favorite tools. Slack, GitHub, Jira, Figma, and many more integrations available.',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
];

const additionalFeatures = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Under 50ms latency for every action. Built for speed to keep you in flow.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SSO, and granular role-based access controls.',
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    description: 'Built-in time tracking to monitor productivity and bill accurately.',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks with custom triggers and actions.',
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Powerful Features for Modern Teams
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Everything you need to ship faster, collaborate better, and build the future together.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 p-8 shadow-sm hover:shadow-premium transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white text-center mb-12">
              Even more ways to boost productivity
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-[var(--radius)] bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-800 hover:border-[var(--brand-primary)] dark:hover:border-purple-500 transition-all duration-300"
                >
                  <feature.icon className="w-5 h-5 text-[var(--brand-primary)] mb-4" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white mb-6">
              Ready to experience these features?
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Start your free trial today and see how Flux can transform your team's workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
              >
                Start Free Trial
              </a>
              <a
                href="/pricing"
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
