# Footer Links Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 18 dedicated pages for footer links with consistent header/footer, SEO metadata, and responsive design.

**Architecture:** Create reusable PageHeader and PageFooter components, then use a shared layout for all static pages to ensure consistency. Each page gets unique metadata for SEO.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS

---

## File Structure

```
components/layout/
├── page-header.tsx      # Reusable header with logo, nav, theme toggle
└── page-footer.tsx     # Reusable footer matching site design

app/
├── features/page.tsx
├── pricing/page.tsx
├── integrations/page.tsx
├── changelog/page.tsx
├── docs/page.tsx
├── api-reference/page.tsx
├── community/page.tsx
├── blog/page.tsx
├── webinars/page.tsx
├── about/page.tsx
├── careers/page.tsx
├── privacy/page.tsx
├── terms/page.tsx
├── security/page.tsx
├── cookies/page.tsx
└── licenses/page.tsx
```

---

## Chunk 1: Create Reusable Layout Components

### Task 1: Create PageHeader component

**Files:**
- Create: `components/layout/page-header.tsx`

- [ ] **Step 1: Create the PageHeader component**

```tsx
'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface PageHeaderProps {
  activeLink?: string;
}

export function PageHeader({ activeLink }: PageHeaderProps) {
  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <img
              src="/icon.svg"
              alt=""
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  activeLink === link.href
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/page-header.tsx
git commit -m "feat: create reusable PageHeader component"
```

### Task 2: Create PageFooter component

**Files:**
- Create: `components/layout/page-footer.tsx`

- [ ] **Step 1: Create the PageFooter component**

```tsx
import Link from 'next/link';

export function PageFooter() {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
    Resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'Community', href: '/community' },
      { label: 'Blog', href: '/blog' },
      { label: 'Webinars', href: '/webinars' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ],
  };

  return (
    <footer className="bg-white dark:bg-slate-950 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
              <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
              The all-in-one workspace for high-performing engineering teams to ship faster.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/page-footer.tsx
git commit -m "feat: create reusable PageFooter component"
```

---

## Chunk 2: Create Product Pages (5 pages)

### Task 3: Features Page

**Files:**
- Create: `app/features/page.tsx`

- [ ] **Step 1: Create the Features page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Features | Flux',
  description: 'Discover all the powerful features Flux provides for modern engineering teams.',
};

const features = [
  {
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time. See changes instantly as they happen.',
    icon: '⚡',
  },
  {
    title: 'Kanban Boards',
    description: 'Visualize your workflow with flexible Kanban boards that adapt to your process.',
    icon: '📋',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track progress, visualize team velocity, and make data-driven decisions.',
    icon: '📊',
  },
  {
    title: 'Task Management',
    description: 'Organize tasks with priorities, assignees, labels, and custom fields.',
    icon: '✓',
  },
  {
    title: 'Team Workspaces',
    description: 'Create dedicated workspaces for different teams or projects.',
    icon: '🏠',
  },
  {
    title: 'Integrations',
    description: 'Connect with your favorite tools including Slack, GitHub, and more.',
    icon: '🔗',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader activeLink="/features" />
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Powerful Features for Modern Teams
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to ship faster and work smarter.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/features/page.tsx
git commit -m "feat: create features page"
```

### Task 4: Pricing Page

**Files:**
- Create: `app/pricing/page.tsx`

- [ ] **Step 1: Create the Pricing page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | Flux',
  description: 'Simple, transparent pricing for teams of all sizes.',
};

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for small teams getting started',
    features: ['Up to 5 team members', '3 workspaces', 'Basic analytics', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/month',
    description: 'For growing teams that need more power',
    features: ['Unlimited team members', 'Unlimited workspaces', 'Advanced analytics', 'Priority support', 'Custom integrations', 'API access'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with specific needs',
    features: ['Everything in Pro', 'Dedicated success manager', 'Custom SLA', 'SSO & SAML', 'Audit logs', 'On-premise option'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader activeLink="/pricing" />
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Choose the plan that fits your team. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${
                  plan.popular
                    ? 'border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="text-purple-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/pricing/page.tsx
git commit -m "feat: create pricing page"
```

### Task 5: Integrations Page

**Files:**
- Create: `app/integrations/page.tsx`

- [ ] **Step 1: Create the Integrations page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Integrations | Flux',
  description: 'Connect Flux with your favorite tools and workflows.',
};

const integrations = [
  { name: 'Slack', category: 'Communication', description: 'Get notifications and updates in Slack' },
  { name: 'GitHub', category: 'Development', description: 'Link commits and PRs to tasks' },
  { name: 'GitLab', category: 'Development', description: 'Connect your GitLab repositories' },
  { name: 'Jira', category: 'Project Management', description: 'Sync issues with Jira' },
  { name: 'Notion', category: 'Documentation', description: 'Link Notion pages to tasks' },
  { name: 'Figma', category: 'Design', description: 'Embed Figma designs in tasks' },
  { name: 'Google Calendar', category: 'Calendar', description: 'Sync deadlines with your calendar' },
  { name: 'Discord', category: 'Communication', description: 'Team notifications in Discord' },
];

const categories = [...new Set(integrations.map((i) => i.category))];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Connect Your Tools
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Flux integrates with the tools you already use. Connect your workflow seamlessly.
            </p>
          </div>
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  {category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {integrations
                    .filter((i) => i.category === category)
                    .map((integration) => (
                      <div
                        key={integration.name}
                        className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                      >
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {integration.description}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Need a specific integration?
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
            >
              Request Integration
            </a>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/integrations/page.tsx
git commit -m "feat: create integrations page"
```

### Task 6: Changelog Page

**Files:**
- Create: `app/changelog/page.tsx`

- [ ] **Step 1: Create the Changelog page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Changelog | Flux',
  description: 'See the latest updates and improvements to Flux.',
};

const changes = [
  {
    version: '2.4.0',
    date: 'March 2026',
    type: 'Feature',
    description: 'Added real-time collaboration for live editing',
  },
  {
    version: '2.3.2',
    date: 'February 2026',
    type: 'Improvement',
    description: 'Performance improvements for large boards',
  },
  {
    version: '2.3.1',
    date: 'February 2026',
    type: 'Fix',
    description: 'Fixed issues with task due date notifications',
  },
  {
    version: '2.3.0',
    date: 'January 2026',
    type: 'Feature',
    description: 'New analytics dashboard with custom reports',
  },
  {
    version: '2.2.0',
    date: 'December 2025',
    type: 'Feature',
    description: 'Added team workspaces and permissions',
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Changelog
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Stay up to date with the latest improvements to Flux.
            </p>
          </div>
          <div className="space-y-8">
            {changes.map((change) => (
              <div
                key={change.version}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {change.version}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      change.type === 'Feature'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : change.type === 'Fix'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {change.type}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {change.date}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {change.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/changelog/page.tsx
git commit -m "feat: create changelog page"
```

---

## Chunk 3: Create Resources Pages (5 pages)

### Task 7: Documentation Page

**Files:**
- Create: `app/docs/page.tsx`

- [ ] **Step 1: Create the Documentation page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation | Flux',
  description: 'Learn how to use Flux with our comprehensive documentation.',
};

const sections = [
  {
    title: 'Getting Started',
    links: [
      { label: 'Quick Start Guide', href: '#' },
      { label: 'Creating Your First Workspace', href: '#' },
      { label: 'Inviting Team Members', href: '#' },
    ],
  },
  {
    title: 'Core Concepts',
    links: [
      { label: 'Understanding Boards', href: '#' },
      { label: 'Working with Tasks', href: '#' },
      { label: 'Using Columns', href: '#' },
    ],
  },
  {
    title: 'Advanced Features',
    links: [
      { label: 'Custom Fields', href: '#' },
      { label: 'Automation Rules', href: '#' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Account & Billing',
    links: [
      { label: 'Managing Your Account', href: '#' },
      { label: 'Updating Your Plan', href: '/pricing' },
      { label: 'Team Permissions', href: '#' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader activeLink="/docs" />
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Documentation
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about using Flux.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/docs/page.tsx
git commit -m "feat: create docs page"
```

### Task 8: API Reference Page

**Files:**
- Create: `app/api-reference/page.tsx`

- [ ] **Step 1: Create the API Reference page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'API Reference | Flux',
  description: 'Complete API documentation for Flux developers.',
};

const endpoints = [
  {
    method: 'GET',
    path: '/api/workspaces',
    description: 'List all workspaces',
  },
  {
    method: 'POST',
    path: '/api/workspaces',
    description: 'Create a new workspace',
  },
  {
    method: 'GET',
    path: '/api/boards',
    description: 'List all boards in a workspace',
  },
  {
    method: 'POST',
    path: '/api/tasks',
    description: 'Create a new task',
  },
  {
    method: 'PATCH',
    path: '/api/tasks/:id',
    description: 'Update a task',
  },
  {
    method: 'DELETE',
    path: '/api/tasks/:id',
    description: 'Delete a task',
  },
];

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              API Reference
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Build custom integrations with the Flux API.
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto">
            <pre className="text-sm text-slate-300">
{`// Example: Get all workspaces
const response = await fetch('https://api.flux.io/v1/workspaces', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const workspaces = await response.json();`}
            </pre>
          </div>
          <div className="mt-8 space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      endpoint.method === 'GET'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : endpoint.method === 'POST'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : endpoint.method === 'PATCH'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-slate-900 dark:text-white font-mono">
                    {endpoint.path}
                  </code>
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api-reference/page.tsx
git commit -m "feat: create API reference page"
```

### Task 9: Community Page

**Files:**
- Create: `app/community/page.tsx`

- [ ] **Step 1: Create the Community page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community | Flux',
  description: 'Join the Flux community of developers and users.',
};

const communityLinks = [
  {
    title: 'Discord Server',
    description: 'Chat with other Flux users and get help',
    icon: '💬',
    link: '#',
  },
  {
    title: 'GitHub Discussions',
    description: 'Share ideas and report issues',
    icon: '🐙',
    link: '#',
  },
  {
    title: 'Twitter',
    description: 'Follow us for updates and news',
    icon: '🐦',
    link: '#',
  },
  {
    title: 'User Groups',
    description: 'Connect with local user groups',
    icon: '👥',
    link: '#',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Join Our Community
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Connect with thousands of Flux users and developers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {communityLinks.map((item) => (
              <Link
                key={item.title}
                href={item.link}
                className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/community/page.tsx
git commit -m "feat: create community page"
```

### Task 10: Blog Page

**Files:**
- Create: `app/blog/page.tsx`

- [ ] **Step 1: Create the Blog page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Blog | Flux',
  description: 'Latest news, tutorials, and insights from Flux.',
};

const posts = [
  {
    title: 'How to Improve Team Velocity with Flux',
    excerpt: 'Learn practical strategies to boost your team productivity.',
    date: 'March 10, 2026',
    category: 'Tips & Tricks',
  },
  {
    title: 'Introducing Flux 2.4 with Real-time Collaboration',
    excerpt: 'Work together with your team like never before.',
    date: 'March 5, 2026',
    category: 'Product',
  },
  {
    title: 'Best Practices for Remote Team Management',
    excerpt: 'Tools and techniques for effective remote team collaboration.',
    date: 'February 28, 2026',
    category: 'Guides',
  },
  {
    title: 'Flux Analytics: Making Data-Driven Decisions',
    excerpt: 'How to use analytics to improve your workflow.',
    date: 'February 20, 2026',
    category: 'Features',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Blog
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Latest news, tutorials, and insights.
            </p>
          </div>
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.title}
                className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                    {post.category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {post.date}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {post.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat: create blog page"
```

### Task 11: Webinars Page

**Files:**
- Create: `app/webinars/page.tsx`

- [ ] **Step 1: Create the Webinars page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Webinars | Flux',
  description: 'Watch webinars and learn how to get the most out of Flux.',
};

const webinars = [
  {
    title: 'Getting Started with Flux',
    description: 'Learn the basics of Flux and how to set up your first workspace.',
    date: 'March 20, 2026',
    duration: '45 min',
    type: 'Live',
  },
  {
    title: 'Advanced Workflow Automation',
    description: 'Master automation rules to streamline your processes.',
    date: 'March 27, 2026',
    duration: '60 min',
    type: 'Live',
  },
  {
    title: 'Team Collaboration Best Practices',
    description: 'How to get your team onboarded and productive quickly.',
    date: 'February 15, 2026',
    duration: '45 min',
    type: 'On Demand',
  },
];

export default function WebinarsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Webinars
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Watch our recorded webinars or join upcoming live sessions.
            </p>
          </div>
          <div className="space-y-6">
            {webinars.map((webinar) => (
              <div
                key={webinar.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      webinar.type === 'Live'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {webinar.type}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {webinar.date}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {webinar.duration}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {webinar.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {webinar.description}
                </p>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                  {webinar.type === 'Live' ? 'Register' : 'Watch Now'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/webinars/page.tsx
git commit -m "feat: create webinars page"
```

---

## Chunk 4: Create Company Pages (2 pages)

### Task 12: About Page

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Create the About page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'About | Flux',
  description: 'Learn about Flux and our mission to help teams ship faster.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              About Flux
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
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
              We're always looking for talented people to join our team. Check out our
              <a href="/careers" className="text-purple-600 dark:text-purple-400"> careers page</a> for open positions.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: create about page"
```

### Task 13: Careers Page

**Files:**
- Create: `app/careers/page.tsx`

- [ ] **Step 1: Create the Careers page**

```tsx
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Join Our Team
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Help us build the future of team collaboration.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Open Positions
            </h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.title}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {job.department} · {job.location}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {job.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 text-slate-600 dark:text-slate-400"
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
```

- [ ] **Step 2: Commit**

```bash
git add app/careers/page.tsx
git commit -m "feat: create careers page"
```

---

## Chunk 5: Create Legal Pages (5 pages)

### Task 14: Privacy Policy Page

**Files:**
- Create: `app/privacy/page.tsx`

- [ ] **Step 1: Create the Privacy Policy page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "feat: create privacy policy page"
```

### Task 15: Terms of Service Page

**Files:**
- Create: `app/terms/page.tsx`

- [ ] **Step 1: Create the Terms of Service page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/terms/page.tsx
git commit -m "feat: create terms of service page"
```

### Task 16: Security Page

**Files:**
- Create: `app/security/page.tsx`

- [ ] **Step 1: Create the Security page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/security/page.tsx
git commit -m "feat: create security page"
```

### Task 17: Cookies Page

**Files:**
- Create: `app/cookies/page.tsx`

- [ ] **Step 1: Create the Cookies page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/cookies/page.tsx
git commit -m "feat: create cookies page"
```

### Task 18: Licenses Page

**Files:**
- Create: `app/licenses/page.tsx`

- [ ] **Step 1: Create the Licenses page**

```tsx
import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Open Source Licenses | Flux',
  description: 'Third-party open source licenses used in Flux.',
};

const licenses = [
  { name: 'React', license: 'MIT', url: 'https://reactjs.org' },
  { name: 'Next.js', license: 'MIT', url: 'https://nextjs.org' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'Framer Motion', license: 'MIT', url: 'https://www.framer.com/motion' },
  { name: 'Lucide React', license: 'ISC', url: 'https://lucide.dev' },
  { name: 'Zod', license: 'MIT', url: 'https://zod.dev' },
  { name: 'Prisma', license: 'Apache 2.0', url: 'https://prisma.io' },
  { name: 'PostgreSQL', license: 'PostgreSQL', url: 'https://postgresql.org' },
];

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Open Source Licenses
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Flux uses the following open source libraries. We're grateful to the
            maintainers and contributors of these projects.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-4 pr-4 font-bold text-slate-900 dark:text-white">
                    Project
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-slate-900 dark:text-white">
                    License
                  </th>
                  <th className="text-left py-4 pl-4 font-bold text-slate-900 dark:text-white">
                    Website
                  </th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((item) => (
                  <tr
                    key={item.name}
                    className="border-b border-slate-200 dark:border-slate-800"
                  >
                    <td className="py-4 pr-4 text-slate-900 dark:text-white font-medium">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                        {item.license}
                      </span>
                    </td>
                    <td className="py-4 pl-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {item.url.replace('https://', '')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-12 text-slate-600 dark:text-slate-400">
            If you believe any license information is incorrect, please{' '}
            <a href="/contact" className="text-purple-600 dark:text-purple-400">
              contact us
            </a>.
          </p>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/licenses/page.tsx
git commit -m "feat: create licenses page"
```

---

## Chunk 6: Update Footer Links in Main Page

### Task 19: Update app/page.tsx Footer Links

**Files:**
- Modify: `app/page.tsx:138-143`

- [ ] **Step 1: Update footer links in homepage**

Replace the footerLinks object in app/page.tsx with:

```tsx
const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'Community', href: '/community' },
    { label: 'Blog', href: '/blog' },
    { label: 'Webinars', href: '/webinars' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Security', href: '/security' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Licenses', href: '/licenses' },
  ],
};
```

Then update the link rendering to use the href from the object:

```tsx
{links.map((link) => (
  <li key={link.label}>
    <Link
      href={link.href}
      className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    >
      {link.label}
    </Link>
  </li>
))}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update footer links with proper routes"
```

---

## Chunk 7: Verify Build

### Task 20: Verify Build and Test

- [ ] **Step 1: Run build to verify all pages compile**

```bash
npm run build
```

Expected: Build completes successfully with no errors

- [ ] **Step 2: Start dev server and verify pages**

```bash
npm run dev
```

- [ ] **Step 3: Test responsive design across viewports**

- [ ] **Step 4: Commit final changes**

```bash
git add .
git commit -m "feat: add all footer link pages with consistent layout"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-03-16-footer-links-pages.md`. Ready to execute?