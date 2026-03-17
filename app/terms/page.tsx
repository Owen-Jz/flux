import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Flux',
  description: 'The terms and conditions for using Flux.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Terms of Service
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: March 2026
          </p>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using Flux, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
            <h2>Use of Service</h2>
            <p>
              You agree to use Flux only for lawful purposes and in accordance with these
              Terms. You will not attempt to gain unauthorized access to any part of the
              service or interfere with its proper functioning.
            </p>
            <h2>Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activities under your account. You must notify us
              immediately of any unauthorized use.
            </p>
            <h2>Intellectual Property</h2>
            <p>
              Flux and its content are protected by copyright, trademark, and other laws.
              You may not reproduce, distribute, or create derivative works without our
              written consent.
            </p>
            <h2>Limitation of Liability</h2>
            <p>
              Flux is provided "as is" without any warranties. We will not be liable
              for any indirect, incidental, or consequential damages arising from your
              use of the service.
            </p>
            <h2>Contact Us</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
              <a href="mailto:legal@flux.io" className="text-purple-600 dark:text-purple-400">legal@flux.io</a>.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
