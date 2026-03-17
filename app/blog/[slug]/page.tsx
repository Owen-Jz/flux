import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const posts: Record<string, {
  category: string;
  categoryColor: string;
  date: string;
  title: string;
  excerpt: string;
  content: string;
}> = {
  'improve-team-velocity': {
    category: 'Tips & Tricks',
    categoryColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    date: 'Mar 10, 2026',
    title: 'How to Improve Team Velocity with Flux',
    excerpt: 'Discover proven strategies to boost your team\'s productivity and ship faster with Flux boards.',
    content: `
## Introduction

Team velocity is more than just a metric—it's a reflection of how well your team collaborates and ships value. In this guide, we'll explore practical strategies to improve your team's velocity using Flux.

## Set Clear Goals

The first step to improving velocity is establishing clear, achievable goals. Use Flux boards to create visual representations of your sprint objectives. Break down large initiatives into manageable tasks and assign them to team members.

## Optimize Your Workflow

Review your board structure regularly. Are your columns helping or hindering progress? Consider implementing WIP (Work in Progress) limits to prevent bottlenecks and keep work flowing smoothly.

## Communicate Effectively

Use Flux's real-time features to keep everyone aligned. Leave comments on tasks, tag team members, and use the activity feed to stay updated on progress.

## Conclusion

Improving team velocity takes time and experimentation. Start with these strategies and iterate based on what works best for your team.
    `,
  },
  'introducing-flux-2-4': {
    category: 'Product',
    categoryColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    date: 'Mar 5, 2026',
    title: 'Introducing Flux 2.4',
    excerpt: 'The latest release brings powerful new automation features and performance improvements.',
    content: `
## What's New in Flux 2.4

We're excited to announce Flux 2.4, our biggest release yet! Here's what's included:

## Automation Rules

Create custom automation rules to streamline repetitive tasks. Set up triggers based on status changes, assignments, or due dates.

## Performance Improvements

We've optimized the board rendering engine for smoother performance, especially with large boards containing hundreds of tasks.

## Dark Mode Updates

Dark mode now includes improved contrast and better accessibility features.

## Try It Today

Update to Flux 2.4 now and start benefiting from these new features!
    `,
  },
  'remote-team-management': {
    category: 'Guides',
    categoryColor: 'bg-green-500/10 text-green-600 dark:text-green-400',
    date: 'Feb 28, 2026',
    title: 'Best Practices for Remote Team Management',
    excerpt: 'Learn how to keep your distributed team aligned and productive with Flux.',
    content: `
## The Remote Challenge

Managing a remote team comes with unique challenges. Without face-to-face interaction, it's easy for teams to drift apart or lose sight of common goals.

## Use Visual Tools

Flux boards provide a single source of truth for your team's work. Make sure everyone has access and understands how to use the board effectively.

## Establish Regular Check-ins

Schedule daily standups using Flux. Keep them short and focused on blockers and progress.

## Overcommunicate

In remote settings, you can't rely on hallway conversations. Use Flux comments, updates, and notifications to keep everyone informed.

## Trust Your Team

Micromanagement doesn't work remotely. Focus on outcomes rather than monitoring every action.
    `,
  },
  'flux-analytics': {
    category: 'Features',
    categoryColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    date: 'Feb 20, 2026',
    title: 'Flux Analytics',
    excerpt: 'Track team performance with powerful analytics and make data-driven decisions.',
    content: `
## Understand Your Team's Performance

Flux Analytics provides deep insights into how your team works. Use these metrics to identify bottlenecks and improve processes.

## Key Metrics

- **Cycle Time**: How long tasks take from start to completion
- **Throughput**: Number of tasks completed per time period
- **Work Distribution**: How work is balanced across team members

## Making Data-Driven Decisions

Use analytics to back up your decisions with real data. Don't guess—know exactly where your team excels and where there's room for improvement.
    `,
  },
  'getting-started-guide': {
    category: 'Guides',
    categoryColor: 'bg-green-500/10 text-green-600 dark:text-green-400',
    date: 'Feb 15, 2026',
    title: 'Getting Started with Flux: A Complete Guide',
    excerpt: 'New to Flux? This comprehensive guide will walk you through setting up your first workspace.',
    content: `
## Welcome to Flux!

This guide will help you get started with Flux in just a few minutes.

## Step 1: Create Your Workspace

Sign up for Flux and create your first workspace. Choose a name that represents your team or project.

## Step 2: Invite Your Team

Collaboration is key. Invite team members to join your workspace and start working together.

## Step 3: Set Up Your Board

Create columns that match your workflow. Common setups include:
- To Do, In Progress, Done
- Backlog, Sprint, Complete

## Step 4: Add Tasks

Start adding tasks to your board. Be specific with titles and add descriptions to provide context.

## Step 5: Get Moving

Drag tasks across columns as work progresses. Keep your board up to date for maximum benefit.
    `,
  },
  'keyboard-shortcuts': {
    category: 'Tips & Tricks',
    categoryColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    date: 'Feb 10, 2026',
    title: '10 Keyboard Shortcuts You Need to Know',
    excerpt: 'Master Flux faster with these essential keyboard shortcuts for power users.',
    content: `
## Speed Up Your Workflow

Keyboard shortcuts can dramatically improve your productivity in Flux. Here are the top 10:

1. **N** - Create new task
2. **/** - Focus search
3. **E** - Edit selected task
4. **D** - Duplicate task
5. **M** - Move task
6. **Delete** - Archive task
7. **←/→** - Navigate columns
8. **↑/↓** - Navigate tasks
9. **Enter** - Open task details
10. **Esc** - Close modal

## Practice Makes Perfect

Try incorporating these shortcuts into your daily workflow. You'll be a Flux power user in no time!
    `,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    return { title: 'Post Not Found | Flux' };
  }

  return {
    title: `${post.title} | Flux Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    notFound();
  }

  const contentSections = post.content.trim().split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/blog" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] dark:text-slate-400 hover:text-[var(--foreground)] dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Blog
          </Link>

          <article>
            <div className="flex items-center gap-4 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${post.categoryColor}`}>
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] dark:text-slate-400 text-sm">
                <CalendarIcon className="w-4 h-4" />
                {post.date}
              </div>
            </div>

            <h1 className="text-4xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              {post.title}
            </h1>

            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed mb-12">
              {post.excerpt}
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              {contentSections.map((section, index) => {
                const trimmed = section.trim();
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-2xl font-bold text-[var(--foreground)] dark:text-white mt-12 mb-4">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('- **')) {
                  const items = trimmed.split('\n').filter(Boolean);
                  return (
                    <ul key={index} className="list-disc pl-6 space-y-2 text-[var(--text-secondary)] dark:text-slate-400 mb-6">
                      {items.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/- \*\*(.*?)\*\*: (.*)/, '<strong>$1</strong>: $2') }} />
                      ))}
                    </ul>
                  );
                }
                if (/^\d+\./.test(trimmed)) {
                  const items = trimmed.split('\n').filter(Boolean);
                  return (
                    <ol key={index} className="list-decimal pl-6 space-y-2 text-[var(--text-secondary)] dark:text-slate-400 mb-6">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace(/^\d+\.\s\*\*(.*?)\*\*/, '$1').replace(/ - /, ' - ')}</li>
                      ))}
                    </ol>
                  );
                }
                return (
                  <p key={index} className="text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed mb-6">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </article>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}
