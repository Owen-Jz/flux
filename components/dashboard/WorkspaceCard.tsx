'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface WorkspaceCardProps {
    id: string;
    name: string;
    slug: string;
    accentColor?: string;
    memberCount: number;
    boardCount: number;
    lastActiveAt: Date;
}

// Generate a deterministic gradient from workspace name
function getGradient(name: string, accentColor?: string): string {
    if (accentColor) {
        return `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`;
    }
    const gradients = [
        'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
}

function formatLastActive(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function WorkspaceCard({
    name,
    slug,
    accentColor,
    memberCount,
    boardCount,
    lastActiveAt,
}: WorkspaceCardProps) {
    const gradient = getGradient(name, accentColor);
    const initial = name.charAt(0).toUpperCase();

    return (
        <Link href={`/${slug}`} className="block">
            <motion.div
                className="card overflow-hidden cursor-pointer group"
                whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)' }}
                transition={{ duration: 0.2 }}
            >
                {/* Gradient Header */}
                <div
                    className="h-20 flex items-center justify-center"
                    style={{ background: gradient }}
                >
                    <span className="text-3xl font-bold text-white opacity-90">
                        {initial}
                    </span>
                </div>

                {/* Card Body */}
                <div className="p-5">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 truncate">
                        {name}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            {memberCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            {boardCount}
                        </span>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                        Last active {formatLastActive(new Date(lastActiveAt))}
                    </p>
                </div>
            </motion.div>
        </Link>
    );
}