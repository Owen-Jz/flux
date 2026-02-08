
"use client";

import { motion } from "framer-motion";
import { Zap, Users, Globe, Layers, BarChart3, Lock } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Optimistic updates ensure every interaction feels instant. No loading spinners, just speed.",
        color: "bg-yellow-500/10 text-yellow-600",
    },
    {
        icon: Users,
        title: "Real-time Collaboration",
        description: "See who's viewing and editing in real-time. Work together on the same board without conflicts.",
        color: "bg-blue-500/10 text-blue-600",
    },
    {
        icon: Globe,
        title: "Public Sharing",
        description: "Share your roadmap or project status with the world via a simple public link.",
        color: "bg-green-500/10 text-green-600",
    },
    {
        icon: Layers,
        title: "Workflow Automation",
        description: "Automate repetitive tasks and keep your team aligned with smart rules.",
        color: "bg-purple-500/10 text-purple-600",
    },
    {
        icon: BarChart3,
        title: "Insightful Reporting",
        description: "Track progress with visual charts and actionable insights to improve team velocity.",
        color: "bg-pink-500/10 text-pink-600",
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description: "Bank-grade security with role-based access control and data encryption.",
        color: "bg-orange-500/10 text-orange-600",
    },
];

export const FeaturesGrid = () => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
                <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="group"
                >
                    <div className="h-full p-8 rounded-2xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-xl hover:shadow-[var(--brand-primary)]/5 transition-all duration-300">
                        <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <feature.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">{feature.title}</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
