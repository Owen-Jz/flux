import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Changelog | Flux',
  description: "See what's new in Flux. We ship improvements every week.",
};

const releases = [
  {
    version: '2.5.0',
    date: 'June 2026',
    tag: 'New',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    changes: [
      'AI Plan streaming — watch tasks generate live on your board',
      'PlanStreamBanner — real-time progress indicator during AI decomposition',
      'PlanCompleteModal with Undo All — review and revoke AI-generated tasks instantly',
      'Hardened trust boundaries for AI-plan — prevents unauthorized execution',
      'Robust terminal states — live counts, cancel-aware modal, dismissable banner',
      'Calendar data-loss fix — board state preserved across all session types',
    ],
  },
  {
    version: '2.4.0',
    date: 'May 2026',
    tag: 'New',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    changes: [
      'Custom field types: number, date, select, and multi-select',
      'Board analytics dashboard with velocity and cycle time charts',
      'Bulk task editing — update status, assignee, or priority on multiple tasks at once',
      'Improved mobile sidebar with gesture support',
    ],
  },
  {
    version: '2.3.0',
    date: 'April 2026',
    tag: 'Improvement',
    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    changes: [
      'Task decomposition powered by AI — break epics into subtasks automatically',
      'Public workspace sharing with view-only guest access',
      'Webhook payloads now include full task context',
      'Faster board load times with optimistic UI updates',
    ],
  },
  {
    version: '2.2.0',
    date: 'March 2026',
    tag: 'Improvement',
    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    changes: [
      'Dark mode redesign with new color system',
      'Google OAuth sign-in',
      'Email verification flow',
      'Rate-limited API with per-key analytics',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/changelog" />
      <main className="pt-32 pb-20">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Changelog
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              We ship every week. Here's what's new.
            </p>
          </div>

          <div className="space-y-12">
            {releases.map((release) => (
              <div key={release.version} className="relative pl-8 border-l-2 border-[var(--border-subtle)]">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--brand-primary)]" />
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xl font-black text-[var(--text-primary)]">v{release.version}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${release.tagColor}`}>{release.tag}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
