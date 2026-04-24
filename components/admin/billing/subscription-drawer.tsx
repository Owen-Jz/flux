'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    ArrowPathIcon,
    ShieldExclamationIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { PlanBadge, StatusBadge } from './plan-badge';
import { getSubscriptionHistory } from '@/actions/admin/billing';
import { extendTrial, forceCancelSubscription } from '@/actions/admin/change-plan';
import type { SubscriptionRow, SubscriptionLifecycleEvent } from '@/lib/types/billing';

interface SubscriptionDrawerProps {
    user: SubscriptionRow;
    onClose: () => void;
    onUpdated: () => void;
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function SubscriptionDrawer({ user, onClose, onUpdated }: SubscriptionDrawerProps) {
    const [history, setHistory] = useState<SubscriptionLifecycleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyError, setHistoryError] = useState(false);
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        getSubscriptionHistory(user.id)
            .then(setHistory)
            .catch(() => setHistoryError(true))
            .finally(() => setLoading(false));
    }, [user.id]);

    const handleExtendTrial = async (days: number) => {
        setActionLoading('trial');
        try {
            await extendTrial(user.id, days);
            const updated = await getSubscriptionHistory(user.id);
            setHistory(updated);
            onUpdated();
        } finally {
            setActionLoading('');
        }
    };

    const handleForceCancel = async () => {
        if (!confirm('Are you sure you want to force-cancel this subscription?')) return;
        setActionLoading('cancel');
        try {
            await forceCancelSubscription(user.id);
            onUpdated();
        } finally {
            setActionLoading('');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-50">Subscription Details</h2>
                            <p className="text-sm text-zinc-500">{user.email}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* User info + badges */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                {user.image
                                    ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-400">{(user.name || '?').charAt(0)}</div>
                                }
                            </div>
                            <div>
                                <p className="text-base font-semibold text-zinc-100">{user.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <PlanBadge plan={user.plan} />
                                    <StatusBadge status={user.subscriptionStatus} />
                                </div>
                            </div>
                        </div>

                        {/* Paystack info */}
                        {(user.paystackCustomerCode || user.subscriptionId) && (
                            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Paystack</p>
                                {user.paystackCustomerCode && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Customer Code</span>
                                        <span className="text-zinc-300 font-mono text-xs">{user.paystackCustomerCode}</span>
                                    </div>
                                )}
                                {user.subscriptionId && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Subscription ID</span>
                                        <span className="text-zinc-300 font-mono text-xs">{user.subscriptionId}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trial info */}
                        {user.trialEndsAt && (
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <ClockIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-300">Trial Active</p>
                                    <p className="text-xs text-blue-400/70">
                                        Ends {new Date(user.trialEndsAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Admin actions */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Actions</p>

                            <div className="flex gap-2">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => handleExtendTrial(days)}
                                        disabled={actionLoading === 'trial'}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <ArrowPathIcon className="w-3.5 h-3.5" />
                                        +{days}d trial
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleForceCancel}
                                disabled={actionLoading === 'cancel'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                <ShieldExclamationIcon className="w-4 h-4" />
                                Force Cancel Subscription
                            </button>
                        </div>

                        {/* Lifecycle timeline */}
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Activity History</p>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : historyError ? (
                                <p className="text-sm text-red-400 text-center py-4">Failed to load history</p>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-zinc-600 text-center py-4">No activity recorded</p>
                            ) : (
                                <div className="relative pl-4 border-l border-zinc-800 space-y-4">
                                    {history.map((event) => (
                                        <div key={event.id} className="relative">
                                            <div className="absolute -left-[17px] w-2 h-2 rounded-full bg-violet-500 mt-1.5" />
                                            <div className="bg-zinc-800/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-zinc-300 capitalize">
                                                        {event.type.replace(/_/g, ' ')}
                                                    </span>
                                                    {event.fromPlan && event.toPlan && (
                                                        <span className="text-xs text-zinc-600">
                                                            {String(event.fromPlan)} → {String(event.toPlan)}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.reason && (
                                                    <p className="text-xs text-zinc-500 mt-0.5">{String(event.reason)}</p>
                                                )}
                                                <p className="text-xs text-zinc-600 mt-1">{timeAgo(new Date(event.createdAt))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
