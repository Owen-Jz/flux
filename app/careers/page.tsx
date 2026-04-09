import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Careers | Flux',
  description: 'Join the Flux team and help shape the future of team collaboration.',
};

const jobs = [
  {
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'San Francisco, CA',
    type: 'Full-time',
  },
  {
    title: 'Technical Writer',
    department: 'Documentation',
    location: 'Remote',
    type: 'Part-time',
  },
];

const benefits = [
  'Competitive salary and equity',
  'Health, dental, and vision insurance',
  'Unlimited PTO',
  'Remote-first culture',
  'Home office stipend',
  'Learning & development budget',
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-6">
              Join Our Team
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Help us build the future of team collaboration.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
              Open Positions
            </h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.title}
                  className="p-6 rounded-xl border border-[var(--border-subtle)] hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {job.title}
                      </h3>
                      <p className="text-[var(--text-secondary)]">
                        {job.department} · {job.location}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--text-tertiary)]">
                      {job.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
              Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 text-[var(--text-secondary)]"
                >
                  <span className="text-purple-500">✓</span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
