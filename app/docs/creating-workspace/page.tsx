import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Creating Workspace | Documentation | Flux',
  description: 'Learn how to create and configure your Flux workspace.',
};

export default function CreatingWorkspacePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/docs" />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--foreground)] dark:text-white mb-6">Creating a Workspace</h1>
          <p className="text-lg text-[var(--text-secondary)] dark:text-slate-400">
            Documentation coming soon.
          </p>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
