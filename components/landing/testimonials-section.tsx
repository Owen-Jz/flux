"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
    {
        quote: "Flux transformed how we build software. It's not just a tool, it's a productivity multiplier for our entire engineering team.",
        author: "Sarah Jenkins",
        role: "CTO at TechFlow",
        avatar: "SJ"
    },
    {
        quote: "The best project management tool we've used. The interface is stunning and the features are exactly what we needed without the bloat.",
        author: "Michael Chen",
        role: "Product Lead at Apex",
        avatar: "MC"
    },
    {
        quote: "Finally, a tool that keeps up with our speed. Real-time collaboration feels like magic on Flux.",
        author: "Jessica Williams",
        role: "Engineering Manager at Bolt",
        avatar: "JW"
    }
];

export const TestimonialsSection = () => {
    return (
        <section className="py-24 px-6 bg-[var(--surface)] border-y border-[var(--border-subtle)]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">Loved by innovative teams</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-[32px] border border-[var(--border-subtle)] hover:shadow-premium transition-all duration-500 group"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                ))}
                            </div>
                            <blockquote className="text-lg text-[var(--foreground)] mb-8 leading-relaxed font-medium">
                                "{testimonial.quote}"
                            </blockquote>
                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-50">
                                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-md">
                                    <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-purple-100" />
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--foreground)]">{testimonial.author}</div>
                                    <div className="text-sm text-[var(--text-secondary)]">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
