import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'About | Flux',
  description: 'Learn about Flux and our mission to help teams ship faster.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-6">
              About Flux
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              We're building the future of team collaboration.
            </p>
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Our Mission</h2>
            <p>
              Flux was founded with a simple mission: to help engineering teams ship
              faster and collaborate more effectively. We believe that great software
              is built by great teams, and the right tools can make all the difference.
            </p>
            <h2>Our Story</h2>
            <p>
              Founded in 2024, Flux started as a small tool for our own engineering team.
              We struggled with scattered tasks, missed deadlines, and siloed communication.
              We built Flux to solve these problems, and quickly realized others faced
              the same challenges.
            </p>
            <h2>Our Values</h2>
            <ul>
              <li><strong>Simplicity</strong> - Complex problems deserve simple solutions</li>
              <li><strong>Speed</strong> - Every feature should make teams faster</li>
              <li><strong>Collaboration</strong> - Great things happen when teams work together</li>
              <li><strong>Reliability</strong> - Trust is earned through consistent performance</li>
            </ul>
            <h2>Join Us</h2>
            <p>
              We're always looking for talented people to join our team. Check out our{' '}
              <Link href="/careers" className="text-purple-600 dark:text-purple-400">careers page</Link> for open positions.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
