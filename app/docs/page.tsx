import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { ArrowRightIcon, BookOpenIcon, Squares2X2Icon, BoltIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Documentation | Flux',
  description: 'Complete documentation for Flux. Learn how to set up your workspace, manage boards and tasks, and get the most out of Flux.',
};

const sections = [
  {
    title: 'Getting Started',
    icon: BookOpenIcon,
    links: [
      { label: 'Quick Start', href: '#' },
      { label: 'Creating Workspace', href: '#' },
      { label: 'Inviting Team', href: '#' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: Squares2X2Icon,
    links: [
      { label: 'Boards', href: '#' },
      { label: 'Tasks', href: '#' },
      { label: 'Columns', href: '#' },
    ],
  },
  {
    title: 'Advanced Features',
    icon: BoltIcon,
    links: [
      { label: 'Custom Fields', href: '#' },
      { label: 'Automation', href: '#' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Account & Billing',
    icon: UserCircleIcon,
    links: [
      { label: 'Managing Account', href: '#' },
      { label: 'Updating Plan', href: '/pricing' },
      { label: 'Permissions', href: '#' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/docs" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Documentation
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Everything you need to know about Flux. From quick start guides to advanced features.
            </p>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {sections.map((section) => (
              <div
                key={section.title}
                className="group rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 p-8 shadow-sm hover:shadow-premium transition-all duration-500"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <section.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-[var(--text-secondary)] dark:text-slate-400 hover:text-[var(--brand-primary)] dark:hover:text-purple-400 font-medium transition-colors group/link"
                      >
                        <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white mb-6">
              Need more help?
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Check out our community forum or contact our support team for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/community"
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
              >
                Join Community
              </Link>
              <Link
                href="/help"
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
