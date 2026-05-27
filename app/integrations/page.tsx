import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Integrations | Flux',
  description: 'Connect Flux with your favorite tools and services.',
};

const integrations = [
  { name: 'GitHub', description: 'Link pull requests and commits directly to tasks.', emoji: '🐙', category: 'Development' },
  { name: 'Slack', description: 'Get task updates and notifications in your channels.', emoji: '💬', category: 'Communication' },
  { name: 'Google Workspace', description: 'Attach Drive files and sync with Google Calendar.', emoji: '🔵', category: 'Productivity' },
  { name: 'Figma', description: 'Embed designs and prototypes inside tasks.', emoji: '🎨', category: 'Design' },
  { name: 'Zapier', description: 'Automate workflows with thousands of apps.', emoji: '⚡', category: 'Automation' },
  { name: 'Jira', description: 'Migrate from Jira and sync issues bi-directionally.', emoji: '🔷', category: 'Project Management' },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/integrations" />
      <main className="pt-32 pb-20">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Integrations
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Flux connects with the tools your team already uses. Plug in your stack and keep everything in sync.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--brand-primary)] transition-colors"
              >
                <div className="text-4xl mb-4">{integration.emoji}</div>
                <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wider">{integration.category}</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 mb-2">{integration.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-[var(--text-secondary)] mb-4">Don&apos;t see your tool?</p>
            <a
              href="mailto:hello@useflux.app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Request an integration
            </a>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
