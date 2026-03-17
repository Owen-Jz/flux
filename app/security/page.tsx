import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Security | Flux',
  description: 'Learn about Flux security practices and policies.',
};

const securityMeasures = [
  {
    title: 'Encryption',
    description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256).',
  },
  {
    title: 'Access Controls',
    description: 'Role-based access control (RBAC) with granular permissions.',
  },
  {
    title: 'Monitoring',
    description: '24/7 security monitoring with automated threat detection.',
  },
  {
    title: 'Backups',
    description: 'Automated daily backups with point-in-time recovery.',
  },
  {
    title: 'Compliance',
    description: 'SOC 2 Type II certified. GDPR and CCPA compliant.',
  },
  {
    title: 'Penetration Testing',
    description: 'Regular third-party penetration testing and vulnerability scans.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Security
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Your data security is our top priority.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {securityMeasures.map((measure) => (
              <div
                key={measure.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {measure.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {measure.description}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Report a Vulnerability
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              If you discover a security vulnerability, please report it responsibly.
            </p>
            <a
              href="mailto:security@flux.io"
              className="inline-block px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
            >
              Contact Security Team
            </a>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
