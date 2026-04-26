import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Inviting Team | Documentation | Flux',
  description: 'Learn how to invite and manage team members in your workspace.',
};

export default function InvitingTeamPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/docs" />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] dark:text-white mb-6">Inviting Your Team</h1>
          <p className="text-lg text-[var(--text-secondary)] dark:text-slate-400">
            Documentation coming soon.
          </p>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
