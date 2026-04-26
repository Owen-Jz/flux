'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StatCardProps {
    label: string;
    value: number;
    change?: string;
    changePositive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    index?: number;
}

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
}

const colorStyles: Record<string, { bg: string; icon: string; glow: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', glow: 'shadow-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', glow: 'shadow-purple-500/20' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', glow: 'shadow-green-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', glow: 'shadow-orange-500/20' },
};

export function StatCard({
    label,
    value,
    change,
    changePositive,
    icon: Icon,
    color,
    index = 0,
}: StatCardProps) {
    const styles = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br from-${color}-500/5 to-transparent`} />
            </div>

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${styles.bg}`}>
                        <Icon className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    {change && (
                        <span className={`text-xs font-medium ${changePositive ? 'text-green-400' : 'text-red-400'}`}>
                            {change}
                        </span>
                    )}
                </div>
                <p className="text-3xl font-bold text-zinc-50 mb-1">
                    <AnimatedCounter value={value} />
                </p>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>

            {/* Accent line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
}