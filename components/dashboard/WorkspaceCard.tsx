'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import {
    StarIcon,
    UsersIcon,
    Squares2X2Icon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

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
    lastActiveAt: string | Date;
    hasUnread?: boolean;
    userPlan?: string;
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

    if (Number.isNaN(diff)) return 'recently';
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
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
    userPlan,
}: WorkspaceCardProps) {
    const prefersReducedMotion = useReducedMotion();
    const { from, to } = getGradient(name, accentColor);
    const gradient = `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
    const initial = name.charAt(0).toUpperCase();
    const isPremium = userPlan === 'pro' || userPlan === 'enterprise';
    const isStarter = userPlan === 'starter';

    return (
        <Link
            href={`/${slug}`}
            aria-label={`Open ${name} workspace — ${formatCount(boardCount, 'board', 'boards')}, ${formatCount(
                memberCount,
                'member',
                'members'
            )}${hasUnread ? ', has unread activity' : ''}`}
            className="block rounded-[var(--flux-radius-xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
            <motion.div
                className="card group relative h-full cursor-pointer overflow-hidden p-5"
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2 }}
            >
                {/* Subtle gradient overlay on hover */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(135deg, ${from}0d 0%, ${to}0d 100%)` }}
                />

                {/* Plan badge — top-right */}
                {isPremium && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <SparklesIconSolid className="h-3 w-3" />
                        PRO
                    </div>
                )}
                {isStarter && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <StarIcon className="h-3 w-3" />
                        PLUS
                    </div>
                )}

                <div className="relative flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14 sm:text-xl ${
                                icon?.type === 'upload' ? '' : 'text-white'
                            }`}
                            style={icon?.type === 'upload' ? {} : { background: gradient }}
                        >
                            {icon?.type === 'emoji' ? (
                                <span className="text-2xl sm:text-3xl">{icon.emoji}</span>
                            ) : icon?.type === 'upload' ? (
                                <Image
                                    src={icon.url || ''}
                                    alt=""
                                    width={56}
                                    height={56}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                initial
                            )}
                        </div>
                        {/* Unread beacon on the avatar — unambiguous, never collides with badge */}
                        {hasUnread && (
                            <span
                                className="absolute -right-1 -top-1 flex h-3.5 w-3.5"
                                aria-hidden="true"
                            >
                                {!prefersReducedMotion && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--error-primary)] opacity-60" />
                                )}
                                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] bg-[var(--error-primary)]" />
                            </span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pr-6">
                        <h3 className="truncate text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)]">
                            {name}
                        </h3>
                        <p className="mb-3 truncate font-mono text-xs text-[var(--text-tertiary)] opacity-70">
                            /{slug}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1.5">
                                <UsersIcon className="h-4 w-4 text-[var(--brand-primary)]" />
                                {formatCount(memberCount, 'member', 'members')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Squares2X2Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                                {formatCount(boardCount, 'board', 'boards')}
                            </span>
                        </div>
                    </div>

                    {/* Hover affordance arrow */}
                    <ArrowRightIcon className="absolute right-0 top-1 h-5 w-5 flex-shrink-0 text-[var(--text-tertiary)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:-translate-x-1" />
                </div>

                {/* Activity footer */}
                <div className="relative mt-4 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                        {!prefersReducedMotion && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--flux-success-primary)] opacity-75" />
                        )}
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--flux-success-primary)]" />
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        Active {formatLastActive(new Date(lastActiveAt))}
                    </span>
                </div>
            </motion.div>
        </Link>
    );
}
