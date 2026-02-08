'use client';

import { useState, useTransition } from 'react';
import { Check, X, Loader2, Clock } from 'lucide-react';
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

export function TeamClient({ accessRequests, slug }: TeamClientProps) {
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
        setProcessingId(requestId);
        startTransition(async () => {
            try {
                await handleAccessRequest(requestId, action);
            } catch (error) {
                console.error('Failed to handle request:', error);
                alert('Failed to process request');
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
            {accessRequests.map((request) => (
                <div
                    key={request.id}
                    className="card p-4 border-amber-200 bg-amber-50/30 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {request.user.image ? (
                                <img
                                    src={request.user.image}
                                    alt=""
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium">
                                    {request.user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-[var(--foreground)]">
                                    {request.user.name}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {request.user.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    Wants {request.requestedRole} access
                                </span>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center justify-end gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(request.createdAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction(request.id, 'approve')}
                                    disabled={isPending}
                                    className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                    title="Approve"
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleAction(request.id, 'deny')}
                                    disabled={isPending}
                                    className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                    title="Deny"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {request.message && (
                        <div className="mt-3 p-3 bg-white/50 rounded-lg text-sm text-[var(--text-secondary)]">
                            <span className="font-medium text-[var(--foreground)]">Message:</span>{' '}
                            {request.message}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
