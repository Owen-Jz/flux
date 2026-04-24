'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMrrHistory, getPlanMigrationFlows } from '@/actions/admin/billing';
import { PlanMigrationChart } from '@/components/admin/billing/plan-migration-chart';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface MrrDataPoint { month: string; mrr: number; }
interface MigrationFlows { [key: string]: number; }

export default function BillingAnalyticsPage() {
    const [mrrData, setMrrData] = useState<MrrDataPoint[]>([]);
    const [migrationFlows, setMigrationFlows] = useState<MigrationFlows>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getMrrHistory(),
            getPlanMigrationFlows(),
        ]).then(([mrr, flows]) => {
            setMrrData(mrr);
            setMigrationFlows(flows);
        }).catch(() => {
            setMrrData([]);
            setMigrationFlows({});
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500">Loading analytics...</span>
                </div>
            </div>
        );
    }

    const chartStyle = {
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: '1px solid #27272a',
    };
    const axisStyle = { fill: '#71717a', fontSize: 12 };
    const tooltipStyle = {
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        color: '#e4e4e7',
    };

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold text-zinc-50">Billing Analytics</h1>
                <p className="text-zinc-500">Revenue trends and plan migration analytics</p>
            </motion.div>

            <div className="space-y-6">
                {/* MRR Over Time */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-base font-semibold text-zinc-50 mb-4">MRR Over Time</h2>
                    {mrrData.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-8">No MRR data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={mrrData} margin={{ left: 10, right: 10 }}>
                                <defs>
                                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="month" tick={axisStyle} tickFormatter={(v: string) => v.slice(5)} />
                                <YAxis tick={axisStyle} tickFormatter={(v: number) => `₦${(v/1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v: number) => [`₦${v.toLocaleString()}`, 'MRR']}
                                    labelFormatter={(label) => ` ${label}`}
                                />
                                <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" fill="url(#mrrGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* Plan Migration Flows */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                    <h2 className="text-base font-semibold text-zinc-50 mb-4">Plan Migration Flows</h2>
                    <PlanMigrationChart flows={migrationFlows} />
                </motion.div>
            </div>
        </div>
    );
}