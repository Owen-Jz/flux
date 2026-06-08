import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Integrations | Flux',
  description: 'Integrations on the Flux roadmap. Connect Flux with the tools your team already uses.',
};

const integrations = [
  { name: 'GitHub', description: 'Link pull requests and commits directly to tasks.', emoji: '🐙', category: 'Development' },
  { name: 'Slack', description: 'Get task updates and notifications in your channels.', emoji: '💬', category: 'Communication' },
  { name: 'Google Workspace', description: 'Attach Drive files and sync with Google Calendar.', emoji: '🔵', category: 'Productivity' },
  { name: 'Figma', description: 'Embed designs and prototypes inside tasks.', emoji: '🎨', category: 'Design' },
  { name: 'Zapier', description: 'Automate workflows with thousands of apps.', emoji: '⚡', category: 'Automation' },
  { name: 'Jira', description: 'Migrate from Jira and sync issues both ways.', emoji: '🔷', category: 'Project Management' },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/integrations" />
      <main className="pt-32 pb-20">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-3 py-1 rounded-full mb-4">
              On the roadmap
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Integrations
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              We&apos;re building deep integrations with the tools your team already uses. These are coming soon — tell us which one you need first.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="relative p-6 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface)]"
              >
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2 py-1 rounded-full">
                  Coming soon
                </span>
                <div className="text-4xl mb-4">{integration.emoji}</div>
                <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wider">{integration.category}</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 mb-2">{integration.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-[var(--text-secondary)] mb-4">Need an integration sooner?</p>
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
