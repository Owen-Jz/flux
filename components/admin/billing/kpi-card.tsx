'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface KpiCardProps {
    label: string;
    value: number | string;
    prefix?: string;
    suffix?: string;
    change?: string;
    changePositive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    index?: number;
}

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }: KpiCardProps & { value: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number') return;
        let startTime: number;
        let frame: number;

        const animate = (t: number) => {
            if (!startTime) startTime = t;
            const progress = Math.min((t - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
    blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-400' },
    purple:  { bg: 'bg-purple-500/10', icon: 'text-purple-400' },
    green:   { bg: 'bg-green-500/10',  icon: 'text-green-400' },
    orange:  { bg: 'bg-orange-500/10', icon: 'text-orange-400' },
    red:     { bg: 'bg-red-500/10',    icon: 'text-red-400' },
    amber:   { bg: 'bg-amber-500/10',  icon: 'text-amber-400' },
};

export function KpiCard({
    label, value, prefix = '', suffix = '',
    change, changePositive,
    icon: Icon, color = 'blue', index = 0,
}: KpiCardProps) {
    const styles = colorMap[color] || colorMap.blue;
    const isNumber = typeof value === 'number';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {isNumber
                        ? <AnimatedNumber value={value as number} prefix={prefix} suffix={suffix} />
                        : <span>{prefix}{value}{suffix}</span>
                    }
                </p>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
}
