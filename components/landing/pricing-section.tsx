"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
        <section id="pricing" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 bg-slate-900/50 relative overflow-hidden" aria-labelledby="pricing-heading">
            {/* Background effects */}
            <div className="absolute inset-0" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100 bg-indigo-900/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 bg-indigo-900/30 text-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                        Pricing
                    </span>
                    <h2 id="pricing-heading" className="text-4xl lg:text-5xl font-black text-slate-900 text-white mb-6 tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-slate-600 text-slate-300">
                        Choose the plan that's right for your team. All plans include a 14-day free trial.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                                plan.popular
                                    ? 'bg-slate-900 bg-slate-800 text-white shadow-2xl scale-105 z-10 ring-2 ring-indigo-500'
                                    : 'bg-white bg-slate-800 border border-slate-200 border-slate-700 text-slate-900 text-white hover:shadow-xl'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6 lg:mb-8">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                                    plan.popular ? 'text-indigo-400' : 'text-slate-500 text-slate-400'
                                }`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl lg:text-5xl font-black tracking-tight">{plan.price}</span>
                                    <span className={`text-sm font-medium ${plan.popular ? 'text-slate-400' : 'text-slate-500 text-slate-400'}`}>
                                        {plan.period}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${plan.popular ? 'text-slate-400' : 'text-slate-600 text-slate-300'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-6 lg:mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <div className={`mt-0.5 p-0.5 rounded-full ${
                                            plan.popular
                                                ? 'bg-indigo-500/20 text-indigo-400'
                                                : 'bg-indigo-100 bg-indigo-900/50 text-indigo-600 text-indigo-400'
                                        }`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className={plan.popular ? 'text-slate-300' : 'text-slate-600 text-slate-300'}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`w-full h-12 lg:h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                    plan.popular
                                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                                        : 'bg-slate-900 bg-slate-700 text-white hover:bg-slate-800 hover:bg-slate-600'
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
