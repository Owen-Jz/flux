"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
    }
];

export const FAQSection = () => {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-6">Frequently Asked Questions</h2>
                    <p className="text-lg text-[var(--text-secondary)]">Everything you need to know about the product and billing.</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <details className="group bg-white rounded-2xl border border-[var(--border-subtle)] overflow-hidden transition-all duration-300 open:shadow-premium">
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-[var(--foreground)] pr-12 relative select-none">
                                    {faq.question}
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 transition-transform duration-300 group-open:rotate-180">
                                        <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                                    </div>
                                </summary>
                                <div className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed">
                                    {faq.answer}
                                </div>
                            </details>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
