import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Community | Flux',
  description: 'Join the Flux community. Connect with other users, share ideas, and get help.',
};

const communities = [
  {
    icon: ChatBubbleLeftRightIcon,
    emoji: '💬',
    title: 'Discord',
    description: 'Join our Discord server to chat with the team and other users in real-time.',
    link: '#',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: null,
    emoji: '🐙',
    title: 'GitHub Discussions',
    description: 'Ask questions, share ideas, and contribute to Flux open-source projects.',
    link: '#',
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  {
    icon: null,
    emoji: '🐦',
    title: 'Twitter',
    description: 'Follow us for the latest updates, tips, and announcements.',
    link: '#',
    color: 'bg-blue-400/10 text-blue-500 dark:text-blue-400',
  },
  {
    icon: UsersIcon,
    emoji: '👥',
    title: 'User Groups',
    description: 'Connect with local user groups and attend events near you.',
    link: '#',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/community" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Join Our Community
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Connect with thousands of teams using Flux. Share knowledge, get help, and shape the future of our product.
            </p>
          </div>

          {/* Community Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {communities.map((community) => (
              <a
                key={community.title}
                href={community.link}
                className="group rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 p-8 shadow-sm hover:shadow-premium transition-all duration-500"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${community.color} flex items-center justify-center text-2xl`}>
                    {community.icon ? (
                      <community.icon className="w-6 h-6" />
                    ) : (
                      community.emoji
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[var(--foreground)] dark:text-white mb-2 group-hover:text-[var(--brand-primary)] dark:group-hover:text-purple-400 transition-colors">
                      {community.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
                      {community.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-24">
            <div className="text-center p-6">
              <div className="text-4xl font-black text-[var(--brand-primary)] dark:text-purple-400 mb-2">
                10K+
              </div>
              <div className="text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                Community Members
              </div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-black text-[var(--brand-primary)] dark:text-purple-400 mb-2">
                500+
              </div>
              <div className="text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                Daily Active Users
              </div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-black text-[var(--brand-primary)] dark:text-purple-400 mb-2">
                24/7
              </div>
              <div className="text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                Community Support
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white mb-6">
              Ready to join the conversation?
            </h2>
            <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Pick your favorite platform and start connecting with the Flux community today.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
