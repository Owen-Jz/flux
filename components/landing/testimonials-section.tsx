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
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white bg-slate-900 border-y border-slate-200 border-slate-800" aria-labelledby="testimonials-heading">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 bg-indigo-900/30 text-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                        Testimonials
                    </span>
                    <h2 id="testimonials-heading" className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 text-white mb-6 tracking-tight">
                        Loved by innovative teams
                    </h2>
                    <p className="text-lg text-slate-600 text-slate-300 max-w-2xl mx-auto">
                        See why thousands of teams choose Flux to power their workflow.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-50 bg-slate-800 p-6 lg:p-8 rounded-2xl border border-slate-200 border-slate-700 hover:shadow-lg hover:border-indigo-200 hover:border-indigo-700 transition-all duration-300 group"
                        >
                            <div className="flex gap-1 mb-4 lg:mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <blockquote className="text-base lg:text-lg text-slate-700 text-slate-200 mb-6 lg:mb-8 leading-relaxed font-medium">
                                "{testimonial.quote}"
                            </blockquote>
                            <div className="flex items-center gap-4 pt-4 lg:pt-6 border-t border-slate-200 border-slate-700">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 from-indigo-900/50 to-purple-900/50 flex items-center justify-center text-indigo-700 text-indigo-300 font-bold text-sm">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-white">{testimonial.author}</div>
                                    <div className="text-sm text-slate-500 text-slate-400">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
