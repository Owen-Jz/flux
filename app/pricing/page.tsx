import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';
import { CheckIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Pricing | Flux',
  description: 'Simple, transparent pricing for teams of all sizes. Choose the plan that fits your needs. Start free, upgrade anytime.',
};

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for individuals and small side projects.',
    features: [
      'Up to 3 Projects',
      'Unlimited Tasks',
      '1 Team Member',
      'Basic Analytics',
      'Community Support',
      'Mobile App Access',
    ],
    cta: 'Start for Free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/month',
    description: 'For growing teams that need more power and flexibility.',
    features: [
      'Unlimited Projects',
      'Unlimited Tasks',
      'Up to 10 Team Members',
      'Advanced Analytics',
      'Priority Support',
      'Custom Workflows',
      'Admin Controls',
      'API Access',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Advanced features and support for large organizations.',
    features: [
      'Unlimited Everything',
      'SSO & SAML',
      'Dedicated Success Manager',
      'Advanced Security',
      'SLA Guarantee',
      'On-premise Deployment',
      'Custom Contracts',
      '24/7 Phone Support',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PageHeader activeLink="/pricing" />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] dark:text-white mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
              Choose the plan that's right for your team. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 items-start mb-24">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[24px] p-8 transition-all duration-500 overflow-hidden ${
                  plan.popular
                    ? 'bg-slate-900 text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] scale-105 z-10'
                    : 'bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800 text-[var(--foreground)] dark:text-white hover:shadow-premium'
                }`}
              >
                {plan.popular && (
                  <>
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                      Most Popular
                    </div>
                  </>
                )}

                <div className="mb-10">
                  <h4 className={`text-sm font-bold uppercase tracking-[0.2em] mb-4 ${
                    plan.popular ? 'text-indigo-400' : 'text-[var(--text-secondary)] dark:text-slate-400'
                  }`}>
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                    <span className={`text-sm font-medium ${
                      plan.popular ? 'text-slate-400' : 'text-[var(--text-secondary)] dark:text-slate-400'
                    }`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    plan.popular ? 'text-slate-400' : 'text-[var(--text-secondary)] dark:text-slate-400'
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1 mb-10">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 p-0.5 rounded-full ${
                          plan.popular ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400'
                        }`}>
                          <CheckIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className={plan.popular ? 'text-slate-300' : 'text-[var(--text-secondary)] dark:text-slate-400'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`w-full h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] dark:text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I change plans at any time?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
                },
                {
                  q: 'Do you offer discounts for nonprofits?',
                  a: 'Yes, we offer 50% off for qualified nonprofits and educational institutions. Contact us for details.',
                },
              ].map((faq) => (
                <div
                  key={faq.q}
                  className="p-6 rounded-[var(--radius)] bg-white dark:bg-slate-900 border border-[var(--border-subtle)] dark:border-slate-800"
                >
                  <h3 className="font-bold text-[var(--foreground)] dark:text-white mb-2">{faq.q}</h3>
                  <p className="text-[var(--text-secondary)] dark:text-slate-400 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
