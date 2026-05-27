import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'API Reference | Flux',
  description: 'Comprehensive API reference for the Flux REST API.',
};

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/workspaces',
    description: 'List all workspaces the authenticated user belongs to.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    method: 'POST',
    path: '/api/v1/workspaces',
    description: 'Create a new workspace.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    method: 'GET',
    path: '/api/v1/workspaces/:slug/boards',
    description: 'List all boards in a workspace.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    method: 'POST',
    path: '/api/v1/workspaces/:slug/boards',
    description: 'Create a new board in a workspace.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    method: 'GET',
    path: '/api/v1/workspaces/:slug/boards/:boardId/tasks',
    description: 'List tasks on a board.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    method: 'POST',
    path: '/api/v1/workspaces/:slug/boards/:boardId/tasks',
    description: 'Create a task on a board.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    method: 'PATCH',
    path: '/api/v1/workspaces/:slug/boards/:boardId/tasks/:taskId',
    description: 'Update a task.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    method: 'DELETE',
    path: '/api/v1/workspaces/:slug/boards/:boardId/tasks/:taskId',
    description: 'Delete a task.',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
];

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/api-reference" />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              API Reference
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              The Flux REST API lets you integrate project data into your own tools and workflows. All endpoints require an API key passed via the <code className="text-sm bg-[var(--background-subtle)] px-1.5 py-0.5 rounded text-[var(--brand-primary)]">Authorization: Bearer &lt;key&gt;</code> header.
            </p>
          </div>

          <div className="mb-10 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-2">Base URL</h2>
            <code className="text-sm text-[var(--brand-primary)]">https://useflux.app/api/v1</code>
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-md w-fit ${endpoint.color}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-[var(--text-primary)] font-mono flex-1 break-all">{endpoint.path}</code>
                <p className="text-sm text-[var(--text-secondary)] sm:max-w-[280px]">{endpoint.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5">
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Full API Docs</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Generate an API key in your workspace settings, then explore the full API documentation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                View Documentation
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-sm font-semibold hover:bg-[var(--background-subtle)] transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
