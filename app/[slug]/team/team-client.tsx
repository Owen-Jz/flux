'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon, ArrowPathIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { handleAccessRequest } from '@/actions/access-control';

interface AccessRequest {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    requestedRole: string;
    message?: string;
    createdAt: string;
}

interface TeamClientProps {
    accessRequests: AccessRequest[];
    slug: string;
}

export function TeamClient({ accessRequests }: TeamClientProps) {
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
        setProcessingId(requestId);
        setError(null);
        startTransition(async () => {
            try {
                await handleAccessRequest(requestId, action);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to process request');
            } finally {
                setProcessingId(null);
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="space-y-3">
            {error && (
                <div
                    className="flex items-center gap-3 rounded-xl border p-3.5"
                    style={{
                        background: 'var(--flux-error-bg)',
                        borderColor: 'var(--flux-error-border)',
                    }}
                >
                    <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--flux-error-primary)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--flux-error-text-strong)' }}>{error}</p>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        className="ml-auto rounded-md p-1 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--flux-error-text)' }}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            <AnimatePresence initial={false}>
                {accessRequests.map((request) => (
                    <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-xl border p-4 transition-shadow hover:shadow-md"
                        style={{
                            background: 'var(--flux-warning-bg)',
                            borderColor: 'var(--flux-warning-border)',
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                                {request.user.image ? (
                                    <Image
                                        src={request.user.image}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                        style={{
                                            background: 'var(--flux-warning-bg-subtle)',
                                            color: 'var(--flux-warning-text-strong)',
                                        }}
                                    >
                                        {request.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                        {request.user.name}
                                    </p>
                                    <p className="truncate text-xs text-[var(--text-secondary)]">
                                        {request.user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-stretch sm:self-auto">
                                <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-right">
                                    <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                        style={{
                                            background: 'var(--flux-warning-bg-subtle)',
                                            color: 'var(--flux-warning-text-strong)',
                                        }}
                                    >
                                        Wants {request.requestedRole.toLowerCase()} access
                                    </span>
                                    <p className="mt-1 flex items-center justify-start gap-1 text-xs text-[var(--text-secondary)] sm:justify-end">
                                        <ClockIcon className="h-3 w-3" />
                                        {formatDate(request.createdAt)}
                                    </p>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => handleAction(request.id, 'approve')}
                                        disabled={isPending}
                                        aria-label="Approve access request"
                                        className="rounded-lg p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        style={{ background: 'var(--flux-success-primary)' }}
                                        title="Approve"
                                    >
                                        {processingId === request.id ? (
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleAction(request.id, 'deny')}
                                        disabled={isPending}
                                        aria-label="Deny access request"
                                        className="rounded-lg border bg-[var(--surface)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--background-subtle)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:[color:var(--flux-error-primary)]"
                                        style={{ borderColor: 'var(--border-subtle)' }}
                                        title="Deny"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {request.message && (
                            <div className="mt-3 rounded-lg bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
                                <span className="font-medium text-[var(--foreground)]">Message:</span>{' '}
                                {request.message}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
