
"use client";

import { motion } from "framer-motion";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function LandingPageAnimation() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1.05]);
    const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

    return (
        <section ref={ref} className="relative py-24 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 -z-10" />
            <div className="max-w-7xl mx-auto">
                <motion.div
                    style={{ scale, rotate }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-subtle)] bg-white/50 backdrop-blur-xl"
                >
                    <div className="absolute top-0 w-full h-12 bg-white/80 border-b border-[var(--border-subtle)] flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="ml-4 w-64 h-6 bg-gray-100 rounded-md" />
                    </div>
                    {/* Placeholder for a screenshot or interactive demo */}
                    <div className="aspect-[16/9] w-full bg-[var(--surface)] flex items-center justify-center pt-12">
                        <p className="text-[var(--text-secondary)]">Application Preview</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
