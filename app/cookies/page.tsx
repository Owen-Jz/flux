import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Cookie Policy | Flux',
  description: 'Learn how Flux uses cookies and similar technologies.',
};

const cookieTypes = [
  {
    type: 'Essential Cookies',
    description: 'Required for the platform to function. These cannot be disabled.',
    examples: ['Session management', 'Authentication', 'Security'],
  },
  {
    type: 'Analytics Cookies',
    description: 'Help us understand how users interact with our platform.',
    examples: ['Page views', 'Traffic sources', 'User interactions'],
  },
  {
    type: 'Marketing Cookies',
    description: 'Used to deliver relevant ads and track campaign performance.',
    examples: ['Ad targeting', 'Conversion tracking', 'Social media'],
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Cookie Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: March 2026
          </p>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              This Cookie Policy explains what cookies are and how Flux uses them.
              By using Flux, you consent to the use of cookies as described in this policy.
            </p>
            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit websites.
              They help remember your preferences and improve your experience.
            </p>
            <h2>Types of Cookies We Use</h2>
          </div>
          <div className="space-y-6 mt-8">
            {cookieTypes.map((cookie) => (
              <div
                key={cookie.type}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {cookie.type}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {cookie.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cookie.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-400"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none mt-8">
            <h2>Managing Cookies</h2>
            <p>
              You can manage or disable cookies through your browser settings. Note
              that disabling essential cookies may affect the functionality of the platform.
            </p>
            <h2>Updates to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of any
              changes by posting the new policy on this page.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
