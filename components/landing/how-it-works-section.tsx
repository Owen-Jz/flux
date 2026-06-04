"use client";

import { motion } from "framer-motion";
import { PencilSquareIcon, CheckCircleIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

const steps = [
    {
        icon: PencilSquareIcon,
        number: "01",
        heading: "Describe",
        copy: "Type what you're building. Project name, rough deadline, any context. Plain English, no templates.",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        icon: CheckCircleIcon,
        number: "02",
        heading: "Review",
        copy: "Flux generates a full board with tasks, priorities, and estimates. Check off what you want, remove what you don't.",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: RocketLaunchIcon,
        number: "03",
        heading: "Done",
        copy: "Your board is live. Start working, share with a client, or hand it to your team.",
        gradient: "from-emerald-500 to-teal-500",
    },
];

export function HowItWorksSection() {
    return (
        <section
            id="how-it-works"
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]"
            aria-labelledby="how-it-works-heading"
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        How it works
                    </span>
                    <h2 id="how-it-works-heading" className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                        From idea to board in three steps
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.12, duration: 0.5 }}
                            className="relative p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]"
                        >
                            <span className="absolute top-6 right-6 text-4xl font-black text-[var(--text-primary)]/[0.06]">
                                {step.number}
                            </span>
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                <step.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{step.heading}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{step.copy}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
