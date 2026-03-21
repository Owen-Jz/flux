"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "/mo",
        description: "Perfect for individuals and small side projects.",
        features: [
            "Up to 3 Projects",
            "Up to 3 Team Members",
            "Unlimited Tasks",
            "Basic Analytics",
            "Community Support"
        ],
        cta: "Start for Free",
        href: "/signup",
        popular: false
    },
    {
        name: "Starter",
        price: "$10",
        period: "/mo",
        description: "For small teams just getting started.",
        features: [
            "Up to 5 Projects",
            "Up to 10 Team Members",
            "Unlimited Tasks",
            "Email Support",
            "Custom Workflows",
            "API Access"
        ],
        cta: "Start Free Trial",
        href: "/signup?plan=starter",
        popular: false
    },
    {
        name: "Pro",
        price: "$25",
        period: "/mo",
        description: "For growing teams that need more power and flexibility.",
        features: [
            "Unlimited Projects",
            "Up to 25 Team Members",
            "Unlimited Tasks",
            "Advanced Analytics",
            "Priority Support",
            "Custom Workflows",
            "Admin Controls",
            "SSO"
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
            "Unlimited Team Members",
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
        <section id="pricing" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] relative overflow-hidden" aria-labelledby="pricing-heading">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] bg-[var(--brand-primary)]/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        Pricing
                    </span>
                    <h2 id="pricing-heading" className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                        Choose the plan that&apos;s right for your team. All plans include a 14-day free trial.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-5 md:p-6 lg:p-8 transition-all duration-300 ${
                                plan.popular
                                    ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-2xl md:scale-105 z-10 ring-2 ring-[var(--brand-primary)]'
                                    : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:shadow-xl'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-[var(--text-inverse)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6 lg:mb-8">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                                    plan.popular ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-tertiary)]'
                                }`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl lg:text-5xl font-black tracking-tight">{plan.price}</span>
                                    <span className={`text-sm font-medium ${plan.popular ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]'}`}>
                                        {plan.period}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${plan.popular ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-6 lg:mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <div className={`mt-0.5 p-0.5 rounded-full ${
                                            plan.popular
                                                ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-secondary)]'
                                                : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                                        }`}>
                                            <CheckIcon className="w-3 h-3" />
                                        </div>
                                        <span className={plan.popular ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`w-full h-12 lg:h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                    plan.popular
                                        ? 'bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--background-subtle)]'
                                        : 'bg-[var(--text-primary)] text-[var(--text-inverse)] hover:opacity-90'
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
