"use client";

import { motion } from "framer-motion";
import { CommandLineIcon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";

const personas = [
    {
        icon: CommandLineIcon,
        title: "Freelance developers & designers",
        headline: "You take on client work solo.",
        description: "Flux turns a brief into a structured plan before the project even starts.",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        icon: RocketLaunchIcon,
        title: "Indie builders",
        headline: "Side project, startup, personal tool.",
        description: "Stop keeping the roadmap in your head.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        icon: UsersIcon,
        title: "Small teams",
        headline: "One person plans, everyone else knows what to do.",
        description: "No status meetings to explain what's happening.",
        gradient: "from-emerald-500 to-teal-500",
    },
];

export function WhoItsForSection() {
    return (
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]" aria-labelledby="who-its-for-heading">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        Who it&apos;s for
                    </span>
                    <h2 id="who-its-for-heading" className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                        Built for people who plan their own work
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {personas.map((persona, index) => (
                        <motion.div
                            key={persona.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.12, duration: 0.5 }}
                            whileHover={{ y: -8 }}
                            className="group relative p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-xl transition-all duration-300"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                <persona.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{persona.title}</h3>
                            <p className="text-sm font-semibold text-[var(--brand-primary)] mb-3">{persona.headline}</p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{persona.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
