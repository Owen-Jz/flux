import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Flux',
  description: 'Learn how Flux collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Privacy Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: March 2026
          </p>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including account
              information such as your name, email address, and company details.
              We also collect data about your usage of our platform to improve our services.
            </p>
            <h2>How We Use Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our
              services, to communicate with you about your account, and to send you
              updates about new features and products.
            </p>
            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect
              your personal information against unauthorized access, alteration, or destruction.
              All data is encrypted in transit and at rest.
            </p>
            <h2>Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information
              at any time. You can also opt out of marketing communications.
            </p>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us
              at <a href="mailto:privacy@flux.io" className="text-purple-600 dark:text-purple-400">privacy@flux.io</a>.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
