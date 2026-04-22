"use client";

import { useRef } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
import { motion, useScroll, useTransform } from "framer-motion";

const testimonials = [
    {
        quote: "We actually shipped our Q4 roadmap on time for the first time in years. Flux just... works.",
        author: "Sarah Jenkins",
        role: "CTO at TechFlow",
        avatar: "SJ",
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        quote: "I stopped getting 'I didn't know that was done' messages. That alone was worth it.",
        author: "Michael Chen",
        role: "Product Lead at Apex",
        avatar: "MC",
        gradient: "from-purple-500 to-pink-500"
    },
    {
        quote: "The moment my team saw each other's cursors on the board, they got it. No training needed.",
        author: "Jessica Williams",
        role: "Engineering Manager at Bolt",
        avatar: "JW",
        gradient: "from-purple-500 to-teal-500"
    },
    {
        quote: "I send my clients a link and they can see exactly where projects stand. Fewer meetings, happier clients.",
        author: "Alex Rivera",
        role: "Freelance Designer",
        avatar: "AR",
        gradient: "from-amber-500 to-orange-500"
    },
    {
        quote: "As a solo founder, I needed something that worked for me—not a team tool forced into solo use. Flux is that.",
        author: "Sam Patel",
        role: "Indie Hacker",
        avatar: "SP",
        gradient: "from-emerald-500 to-teal-500"
    },
    {
        quote: "The client portal view alone changed how I run my agency. Professional without the overhead.",
        author: "Jordan Kim",
        role: "Agency Owner",
        avatar: "JK",
        gradient: "from-rose-500 to-pink-500"
    }
];

export const TestimonialsSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <section ref={containerRef} className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)] border-y border-[var(--border-subtle)]" aria-labelledby="testimonials-heading">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[800px] max-h-[800px] bg-[var(--brand-primary)]/5 rounded-full blur-[120px]" />
            </div>

            <motion.div style={{ y }} className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-12 lg:mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--brand-primary)]/20 to-[var(--info-primary)]/20 border border-[var(--brand-primary)]/30 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4"
                    >
                        Testimonials
                    </motion.span>
                    <motion.h2
                        id="testimonials-heading"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight"
                    >
                        From teams to solo founders
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
                    >
                        Teams, freelancers, and solo builders. Here's what happens when you stop the chaos.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.15, duration: 0.5 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="bg-[var(--surface)]/80 p-5 md:p-6 lg:p-8 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-lg transition-all duration-300 group backdrop-blur-xl"
                        >
                            <div className="flex gap-1 mb-4 lg:mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} className="w-4 h-4 fill-[var(--warning-primary)] text-[var(--warning-primary)]" />
                                ))}
                            </div>
                            <blockquote className="text-sm md:text-base lg:text-lg text-[var(--text-secondary)] mb-4 md:mb-6 lg:mb-8 leading-relaxed font-medium">
                                &quot;{testimonial.quote}&quot;
                            </blockquote>
                            <div className="flex items-center gap-4 pt-4 lg:pt-6 border-t border-[var(--border-subtle)]">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--text-primary)]">{testimonial.author}</div>
                                    <div className="text-sm text-[var(--text-tertiary)]">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};
