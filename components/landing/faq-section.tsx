"use client";

import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";

const faqs = [
    {
        question: "How good is the AI plan it generates?",
        answer: "Good enough to start from, not so rigid you're stuck with it. Flux breaks your description into real tasks with priorities and time estimates, organised into columns. You review everything before it's created — keep what fits, drop what doesn't."
    },
    {
        question: "Can I edit the plan before it creates anything?",
        answer: "Yes. Nothing is created until you confirm. You see the full board first — every task, priority, and estimate — and check off exactly what you want. You can also undo an entire generated plan in one click after the fact."
    },
    {
        question: "Does it work for any type of project?",
        answer: "It works best for project and client work that breaks down into concrete tasks — building a site, shipping a feature, launching something. The more context you give in your description, the sharper the plan."
    },
    {
        question: "What happens to my data?",
        answer: "Your project descriptions are used only to generate your plan. Your boards and tasks are yours — encrypted, private, and never sold. You can export or delete them at any time."
    },
    {
        question: "Is there a free plan?",
        answer: "Yes. The Free plan lets you try AI planning and manage real projects at no cost. Paid plans unlock unlimited AI planning and full multi-board project generation."
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
                        isOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
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
                        Questions, answered
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                        The stuff you actually want to know before signing up.
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
