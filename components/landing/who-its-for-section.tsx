"use client";

import { motion } from "framer-motion";
import { UsersIcon, BriefcaseIcon, UserIcon } from "@heroicons/react/24/outline";

const personas = [
    {
        icon: UsersIcon,
        title: "Teams",
        headline: "Collaborate without the chaos",
        description: "See what everyone's working on in real-time. Stop stepping on each other's toes.",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        icon: BriefcaseIcon,
        title: "Freelancers & Agencies",
        headline: "Manage clients with confidence",
        description: "Share progress without chaos. Keep clients informed and happy without endless status calls.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        icon: UserIcon,
        title: "Solo Professionals",
        headline: "Your work, organized",
        description: "Personal task management that actually works. No team required—just you and your goals.",
        gradient: "from-emerald-500 to-teal-500",
    },
];

export function WhoItsForSection() {
    return (
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background)]" aria-labelledby="who-its-for-heading">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        Who it's for
                    </span>
                    <h2 id="who-its-for-heading" className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        Built for how you actually work
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Whether you're a growing team, a solo freelancer, or just trying to get your own work together—Flux adapts to you.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {personas.map((persona, index) => (
                        <motion.div
                            key={persona.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.12, duration: 0.5 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                <persona.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{persona.title}</h3>
                            <p className="text-sm font-semibold text-[var(--brand-primary)] mb-4">{persona.headline}</p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{persona.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}