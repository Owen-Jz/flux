"use client";

import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";

const faqs = [
    {
        question: "Is Flux free to use?",
        answer: "Yes, our Starter plan is completely free for individuals and small teams. It includes up to 3 projects and unlimited tasks."
    },
    {
        question: "Can I import data from other tools?",
        answer: "Absolutely. We offer one-click imports from Jira, Trello, and Asana so you can switch tools without losing any context."
    },
    {
        question: "How secure is my data?",
        answer: "We take security seriously. All data is encrypted at rest and in transit. We are SOC2 Type II compliant and perform regular security audits."
    },
    {
        question: "Do you offer discounts for non-profits?",
        answer: "Yes! We offer a 50% discount on all paid plans for verified non-profit organizations and educational institutions."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans. All payments are processed securely through Stripe."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
    }
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden transition-all duration-300 hover:border-[var(--brand-primary)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2"
                aria-expanded={isOpen}
            >
                <div className="flex items-center justify-between p-5 lg:p-6">
                    <span className="font-bold text-[var(--text-primary)] pr-8 text-sm lg:text-base">
                        {question}
                    </span>
                    <ChevronDownIcon
                        className={`w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-5 lg:px-6 pb-5 lg:pb-6 text-[var(--text-secondary)] leading-relaxed text-sm lg:text-base">
                        {answer}
                    </div>
                </div>
            </button>
        </motion.div>
    );
}

export const FAQSection = () => {
    return (
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]" aria-labelledby="faq-heading">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        FAQ
                    </span>
                    <h2 id="faq-heading" className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] mb-4 tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                        Everything you need to know about Flux.
                    </p>
                </div>

                <div className="space-y-3 lg:space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} {...faq} index={index} />
                    ))}
                </div>

                <div className="text-center mt-10">
                    <p className="text-[var(--text-secondary)]">
                        Still have questions?{' '}
                        <Link href="/contact" className="text-[var(--brand-primary)] font-semibold hover:underline">
                            Contact our support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};
