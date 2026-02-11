"use client";

import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "/mo",
        description: "Perfect for individuals and small side projects.",
        features: [
            "Up to 3 Projects",
            "Unlimited Tasks",
            "1 Team Member",
            "Basic Analytics",
            "Community Support"
        ],
        cta: "Start for Free",
        href: "/signup",
        popular: false
    },
    {
        name: "Pro",
        price: "$12",
        period: "/mo",
        description: "For growing teams that need more power and flexibility.",
        features: [
            "Unlimited Projects",
            "Unlimited Tasks",
            "Up to 10 Team Members",
            "Advanced Analytics",
            "Priority Support",
            "Custom Workflows",
            "Admin Controls"
        ],
        cta: "Start Free Trial",
        href: "/signup?plan=pro",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Advanced features and support for large organizations.",
        features: [
            "Unlimited Everything",
            "SSO & SAML",
            "Dedicated Success Manager",
            "Advanced Security",
            "SLA Guarantee",
            "On-premise Deployment",
            "Custom Contracts"
        ],
        cta: "Contact Sales",
        href: "/contact",
        popular: false
    }
];

export const PricingSection = () => {
    return (
        <section id="pricing" className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-4">Pricing</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
                        Simple, transparent pricing
                    </h3>
                    <p className="text-xl text-[var(--text-secondary)]">
                        Choose the plan that's right for your team. All plans include a 14-day free trial.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-[24px] p-8 transition-all duration-500 overflow-hidden ${plan.popular
                                    ? 'bg-slate-900 text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] scale-105 z-10'
                                    : 'bg-white border border-[var(--border-subtle)] text-[var(--foreground)] hover:shadow-premium'
                                }`}
                        >
                            {plan.popular && (
                                <>
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                                    <div className="noise opacity-10" />
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                                        Best Value
                                    </div>
                                </>
                            )}

                            <div className="mb-10">
                                <h4 className={`text-sm font-bold uppercase tracking-[0.2em] mb-4 ${plan.popular ? 'text-indigo-400' : 'text-[var(--text-secondary)]'}`}>
                                    {plan.name}
                                </h4>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                                    <span className={`text-sm font-medium ${plan.popular ? 'text-slate-400' : 'text-[var(--text-secondary)]'}`}>{plan.period}</span>
                                </div>
                                <p className={`text-sm leading-relaxed ${plan.popular ? 'text-slate-400' : 'text-[var(--text-secondary)]'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="flex-1 mb-10">
                                <ul className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={plan.popular ? 'text-slate-300' : 'text-[var(--text-secondary)]'}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                href={plan.href}
                                className={`w-full h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${plan.popular
                                        ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
