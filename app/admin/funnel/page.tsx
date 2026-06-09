'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFunnelMetrics, type FunnelMetrics, type RecentEvent } from '@/actions/admin/funnel';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const EVENT_STYLE: Record<string, { label: string; dot: string; text: string }> = {
    signup: { label: 'Signed up', dot: 'bg-blue-500', text: 'text-blue-400' },
    app_opened: { label: 'Opened app', dot: 'bg-zinc-500', text: 'text-zinc-400' },
    board_created: { label: 'Created board', dot: 'bg-green-500', text: 'text-green-400' },
    ai_plan_used: { label: 'Used AI plan', dot: 'bg-violet-500', text: 'text-violet-400' },
    task_created: { label: 'Created task', dot: 'bg-amber-500', text: 'text-amber-400' },
    member_invited: { label: 'Invited teammate', dot: 'bg-pink-500', text: 'text-pink-400' },
};

function timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatMeta(meta: Record<string, unknown> | null): string {
    if (!meta) return '';
    const parts = Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}: ${String(v)}`);
    return parts.join(' · ');
}

function FunnelBar({ step, index, maxUsers }: { step: FunnelMetrics['steps'][number]; index: number; maxUsers: number }) {
    // Bar width is relative to the widest step so the shape reads even when the
    // signup baseline is small. Minimum 4% so a non-zero step is always visible.
    const width = maxUsers > 0 ? Math.max(4, Math.round((step.users / maxUsers) * 100)) : 0;
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="space-y-2"
        >
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-200">{step.label}</span>
                <span className="text-zinc-400">
                    <span className="font-bold text-zinc-50">{step.users}</span>
                    <span className="text-zinc-600"> {step.users === 1 ? 'user' : 'users'}</span>
                    <span className="ml-3 text-xs text-zinc-500">{step.conversion}%</span>
                </span>
            </div>
            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: 0.1 + index * 0.06, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                />
            </div>
        </motion.div>
    );
}

function EventRow({ ev, index }: { ev: RecentEvent; index: number }) {
    const style = EVENT_STYLE[ev.event] || { label: ev.event, dot: 'bg-zinc-500', text: 'text-zinc-400' };
    const meta = formatMeta(ev.metadata);
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.4) }}
            className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors"
        >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">
                    <span className={`font-medium ${style.text}`}>{style.label}</span>
                    {ev.userName || ev.userEmail ? (
                        <span className="text-zinc-500"> — {ev.userName || ev.userEmail}</span>
                    ) : null}
                </p>
                {meta ? <p className="text-xs text-zinc-600 truncate">{meta}</p> : null}
            </div>
            <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(ev.createdAt)}</span>
        </motion.div>
    );
}

export default function AdminFunnelPage() {
    const [data, setData] = useState<FunnelMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function load(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        try {
            const metrics = await getFunnelMetrics();
            setData(metrics);
        } catch (error) {
            console.error('Failed to fetch funnel metrics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading funnel...</span>
                </div>
            </div>
        );
    }

    const maxUsers = data ? Math.max(1, ...data.steps.map((s) => s.users)) : 1;

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <FunnelIcon className="w-6 h-6 text-violet-400" />
                        Activation Funnel
                    </h1>
                    <p className="text-zinc-500">Where real users fall off — signup to inviting a teammate</p>
                </div>
                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold text-zinc-50 mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        Funnel
                    </h2>
                    <p className="text-xs text-zinc-600 mb-6">% is share of signups. Invited a teammate is the real win.</p>
                    <div className="space-y-5">
                        {data?.steps.map((step, index) => (
                            <FunnelBar key={step.key} step={step} index={index} maxUsers={maxUsers} />
                        ))}
                    </div>
                    {data && data.steps[0].users === 0 && (
                        <p className="mt-6 text-xs text-amber-400/80">
                            No tracked signups yet. Users who existed before tracking went live won&apos;t appear at the
                            signup step, so later steps may read over 100% until your new cohort signs up.
                        </p>
                    )}
                </motion.div>

                {/* Live feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold text-zinc-50 mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Live activity
                        <span className="ml-auto text-xs font-normal text-zinc-600">{data?.totalEvents ?? 0} events total</span>
                    </h2>
                    <p className="text-xs text-zinc-600 mb-6">Last 50 events — watch what real users actually do.</p>
                    <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                        {data && data.recent.length > 0 ? (
                            data.recent.map((ev, index) => <EventRow key={ev.id} ev={ev} index={index} />)
                        ) : (
                            <div className="text-center py-12">
                                <FunnelIcon className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                                <p className="text-zinc-500 text-sm">No events yet. They&apos;ll appear here as users act.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
