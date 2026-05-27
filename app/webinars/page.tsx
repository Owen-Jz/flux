import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Webinars | Flux',
  description: 'Live and on-demand sessions to help your team get the most out of Flux.',
};

const upcoming = [
  {
    title: 'Getting Started with Flux',
    date: 'June 5, 2026 · 11:00 AM PT',
    description: 'A 45-minute live walkthrough covering workspace setup, board creation, and inviting your team.',
    type: 'Live',
  },
  {
    title: 'Advanced Workflows & Automation',
    date: 'June 19, 2026 · 11:00 AM PT',
    description: 'Deep-dive into custom fields, webhook automation, and the Flux REST API.',
    type: 'Live',
  },
];

const onDemand = [
  {
    title: 'Migrating from Jira to Flux',
    duration: '38 min',
    description: 'Step-by-step guide to importing your Jira projects, epics, and sprints into Flux.',
  },
  {
    title: 'Team Roles & Permissions',
    duration: '22 min',
    description: 'How to manage workspace members, set roles, and control access at the board level.',
  },
  {
    title: 'Using the Flux API',
    duration: '30 min',
    description: 'Build integrations and automate workflows with the Flux REST API and webhooks.',
  },
];

export default function WebinarsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/webinars" />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Webinars
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Live sessions and recordings to help your team ship faster with Flux.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Upcoming Live Sessions</h2>
            <div className="space-y-4">
              {upcoming.map((event) => (
                <div
                  key={event.title}
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{event.type}</span>
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] mb-1">{event.title}</h3>
                    <p className="text-sm text-[var(--brand-primary)] font-medium mb-2">{event.date}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{event.description}</p>
                  </div>
                  <a
                    href="mailto:hello@useflux.app"
                    className="flex-shrink-0 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity text-center"
                  >
                    Register Free
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">On-Demand Recordings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {onDemand.map((video) => (
                <div
                  key={video.title}
                  className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[var(--brand-primary)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{video.duration}</span>
                  <h3 className="font-bold text-[var(--text-primary)] mt-1 mb-2">{video.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{video.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
