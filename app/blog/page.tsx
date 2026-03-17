import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { CalendarIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Blog | Flux',
  description: 'Latest news, tips, and insights from the Flux team. Learn how to get the most out of Flux.',
};

const posts = [
  {
    slug: 'improve-team-velocity',
    category: 'Tips & Tricks',
    categoryColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    date: 'Mar 10, 2026',
    title: 'How to Improve Team Velocity with Flux',
    excerpt: 'Discover proven strategies to boost your team\'s productivity and ship faster with Flux boards.',
  },
  {
    slug: 'introducing-flux-2-4',
    category: 'Product',
    categoryColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    date: 'Mar 5, 2026',
    title: 'Introducing Flux 2.4',
    excerpt: 'The latest release brings powerful new automation features and performance improvements.',
  },
  {
    slug: 'remote-team-management',
    category: 'Guides',
    categoryColor: 'bg-green-500/10 text-green-600 dark:text-green-400',
    date: 'Feb 28, 2026',
    title: 'Best Practices for Remote Team Management',
    excerpt: 'Learn how to keep your distributed team aligned and productive with Flux.',
  },
  {
    slug: 'flux-analytics',
    category: 'Features',
    categoryColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    date: 'Feb 20, 2026',
    title: 'Flux Analytics',
    excerpt: 'Track team performance with powerful analytics and make data-driven decisions.',
  },
  {
    slug: 'getting-started-guide',
    category: 'Guides',
    categoryColor: 'bg-green-500/10 text-green-600 dark:text-green-400',
    date: 'Feb 15, 2026',
    title: 'Getting Started with Flux: A Complete Guide',
    excerpt: 'New to Flux? This comprehensive guide will walk you through setting up your first workspace.',
  },
  {
    slug: 'keyboard-shortcuts',
    category: 'Tips & Tricks',
    categoryColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    date: 'Feb 10, 2026',
    title: '10 Keyboard Shortcuts You Need to Know',
    excerpt: 'Master Flux faster with these essential keyboard shortcuts for power users.',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/blog" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Blog
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Latest news, tips, and insights from the Flux team.
            </p>
          </div>

          {/* Blog Posts */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 p-8 shadow-sm hover:shadow-premium transition-all duration-500"
              >
                <article>
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${post.categoryColor}`}>
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] dark:text-slate-400 text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      {post.date}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] dark:text-white mb-3 group-hover:text-[var(--brand-primary)] dark:group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
                    {post.excerpt}
                  </p>
                </article>
              </Link>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="text-center p-12 rounded-[var(--radius)] bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-[var(--foreground)] dark:text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Subscribe to our newsletter to get the latest articles and updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[var(--foreground)] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
