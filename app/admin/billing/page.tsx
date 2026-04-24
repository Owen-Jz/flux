'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, UserMinusIcon, UserPlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { getBillingMetrics } from '@/actions/admin/billing';
import { KpiCard } from '@/components/admin/billing/kpi-card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { BillingMetrics } from '@/lib/types/billing';

const PLAN_COLORS = ['#71717a', '#22c55e', '#8b5cf6', '#f59e0b'];

export default function BillingDashboardPage() {
    const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBillingMetrics()
            .then(setMetrics)
            .catch(() => setMetrics(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading billing metrics...</span>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Failed to load billing metrics. Please try again.
            </div>
        );
    }

    const pieData = Object.entries(metrics.planDistribution)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(d => d.value > 0);

    const kpis = [
        {
            label: 'Monthly Recurring Revenue',
            value: metrics.mrr,
            prefix: '₦',
            change: metrics.mrrChange >= 0 ? `+${metrics.mrrChange}%` : `${metrics.mrrChange}%`,
            changePositive: metrics.mrrChange >= 0,
            icon: CurrencyDollarIcon,
            color: 'green',
        },
        {
            label: 'Churn Rate (30d)',
            value: metrics.churnRate,
            suffix: '%',
            change: `${metrics.churnChange >= 0 ? '+' : ''}${metrics.churnChange}% vs last mo`,
            changePositive: metrics.churnChange <= 0,
            icon: UserMinusIcon,
            color: 'red',
        },
        {
            label: 'Trial → Paid (30d)',
            value: metrics.trialToPaidRate,
            suffix: '%',
            icon: UserPlusIcon,
            color: 'blue',
        },
        {
            label: 'Net MRR',
            value: metrics.netMrr,
            prefix: '₦',
            icon: ArrowTrendingUpIcon,
            color: 'amber',
        },
    ];

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Billing</h1>
                <p className="text-zinc-500">Subscription overview and key metrics</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, i) => (
                    <KpiCard key={kpi.label} {...kpi} index={i} />
                ))}
            </div>

            {/* Plan Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-zinc-50 mb-4">Plan Distribution</h2>
                {pieData.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8">No plan data available</p>
                ) : (
                    <div className="flex items-center gap-8">
                        <ResponsiveContainer width={240} height={240}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={PLAN_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '12px',
                                        color: '#e4e4e7',
                                    }}
                                    formatter={(value: number) => [value, 'Users']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: PLAN_COLORS[i] }}
                                    />
                                    <span className="text-sm text-zinc-400">{item.name}</span>
                                    <span className="text-sm font-semibold text-zinc-200 ml-auto">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}