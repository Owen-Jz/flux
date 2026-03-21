'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface WorkspaceCardProps {
    name: string;
    slug: string;
    accentColor?: string;
    icon?: {
        type: 'upload' | 'emoji';
        url?: string;
        emoji?: string;
    };
    memberCount: number;
    boardCount: number;
    lastActiveAt: Date;
    hasUnread?: boolean;
}

// Generate a deterministic gradient from workspace name
function getGradient(name: string, accentColor?: string): { from: string; to: string } {
    if (accentColor) {
        return { from: accentColor, to: accentColor + 'cc' };
    }
    const gradients = [
        { from: '#6366f1', to: '#8b5cf6' },
        { from: '#f59e0b', to: '#ef4444' },
        { from: '#10b981', to: '#06b6d4' },
        { from: '#ec4899', to: '#f97316' },
        { from: '#3b82f6', to: '#6366f1' },
        { from: '#14b8a6', to: '#22c55e' },
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

function formatCount(count: number, singular: string, plural: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function WorkspaceCard({
    name,
    slug,
    accentColor,
    icon,
    memberCount,
    boardCount,
    lastActiveAt,
    hasUnread,
}: WorkspaceCardProps) {
    const { from, to } = getGradient(name, accentColor);
    const gradient = `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
    const initial = name.charAt(0).toUpperCase();

    return (
        <Link href={`/${slug}`} className="block">
            <motion.div
                className="card overflow-hidden cursor-pointer group p-5"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                style={{
                    boxShadow: 'var(--flux-shadow-sm)',
                }}
            >
                <div className="flex items-start gap-4">
                    {/* Avatar Circle */}
                    <div className="relative flex-shrink-0">
                        <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg overflow-hidden ${
                                icon?.type === 'upload' ? '' : 'text-white'
                            }`}
                            style={icon?.type === 'upload' ? {} : { background: gradient }}
                        >
                            {icon?.type === 'emoji' ? (
                                <span className="text-3xl">{icon.emoji}</span>
                            ) : icon?.type === 'upload' ? (
                                <img src={icon.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                initial
                            )}
                        </div>
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--error-primary)] rounded-full border-2 border-[var(--surface)]" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Workspace name and arrow */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-[var(--text-primary)] text-base truncate">
                                {name}
                            </h3>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-tertiary)] flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </div>

                        {/* Slug */}
                        <p className="text-xs text-[var(--text-tertiary)] mb-3 font-mono">
                            /{slug}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-[var(--flux-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {formatCount(memberCount, 'member', 'members')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-[var(--flux-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                {formatCount(boardCount, 'board', 'boards')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Activity indicator */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--flux-border-subtle)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--flux-success-primary)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--flux-success-primary)]" />
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        Last active {formatLastActive(new Date(lastActiveAt))}
                    </span>
                </div>
            </motion.div>
        </Link>
    );
}