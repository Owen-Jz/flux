import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { MessageSquare, Code, Trello, FileText, Figma, Calendar, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Integrations | Flux',
  description: 'Connect Flux with your favorite tools. Integrate with Slack, GitHub, Jira, Figma, and more to streamline your workflow.',
};

const integrations = {
  'Communication': [
    {
      name: 'Slack',
      description: 'Get notifications, create tasks, and collaborate without leaving Slack.',
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
    {
      name: 'Discord',
      description: 'Send task updates and notifications directly to your Discord channels.',
      icon: MessageSquare,
      color: 'bg-indigo-500',
    },
  ],
  'Development': [
    {
      name: 'GitHub',
      description: 'Link commits, PRs, and issues to your Flux tasks automatically.',
      icon: Code,
      color: 'bg-slate-800',
    },
    {
      name: 'GitLab',
      description: 'Connect GitLab pipelines and merge requests to your workflow.',
      icon: Code,
      color: 'bg-orange-500',
    },
    {
      name: 'Jira',
      description: 'Two-way sync with Jira for seamless project management.',
      icon: Trello,
      color: 'bg-blue-600',
    },
  ],
  'Project Management': [
    {
      name: 'Jira',
      description: 'Two-way sync with Jira for seamless project management.',
      icon: Trello,
      color: 'bg-blue-600',
    },
    {
      name: 'Trello',
      description: 'Import boards and sync cards between Trello and Flux.',
      icon: Trello,
      color: 'bg-blue-400',
    },
  ],
  'Documentation': [
    {
      name: 'Notion',
      description: 'Link Notion pages to tasks and keep documentation in sync.',
      icon: FileText,
      color: 'bg-slate-800',
    },
    {
      name: 'Confluence',
      description: 'Connect Confluence pages to your project documentation.',
      icon: FileText,
      color: 'bg-blue-600',
    },
  ],
  'Design': [
    {
      name: 'Figma',
      description: 'Embed Figma designs and prototypes directly in your tasks.',
      icon: Figma,
      color: 'bg-purple-500',
    },
  ],
  'Calendar': [
    {
      name: 'Google Calendar',
      description: 'Sync tasks with Google Calendar for better scheduling.',
      icon: Calendar,
      color: 'bg-blue-500',
    },
  ],
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/integrations" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Connect Your Tools
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Flux integrates with the tools you already use. Streamline your workflow and keep everything connected.
            </p>
          </div>

          {/* Integrations by Category */}
          {Object.entries(integrations).map(([category, items]) => (
            <div key={category} className="mb-16">
              <h2 className="text-2xl font-bold text-[var(--foreground)] dark:text-white mb-8">
                {category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((integration) => (
                  <div
                    key={integration.name}
                    className="group rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 p-6 hover:border-[var(--brand-primary)] dark:hover:border-purple-500 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center shrink-0`}>
                        <integration.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] dark:text-white mb-2">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-secondary)] dark:text-slate-500 uppercase tracking-wider">
                        Available Now
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Request Integration */}
          <div className="mt-24 p-12 rounded-[24px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-[var(--border-subtle)] dark:border-slate-700 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white mb-4">
              Need a specific integration?
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              We're constantly adding new integrations. Let us know what tools you need and we'll prioritize them.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              Request Integration
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
