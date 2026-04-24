'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanMigrationChartProps {
    flows: Record<string, number>; // e.g. { "free→starter": 12, "starter→pro": 5 }
}

const PLAN_COLORS: Record<string, string> = {
    free:      '#71717a',
    starter:   '#22c55e',
    pro:       '#8b5cf6',
    enterprise:'#f59e0b',
    unknown:   '#71717a',
};

function parseFlowLabel(key: string) {
    const [from, to] = key.split('→');
    return { from, to };
}

export function PlanMigrationChart({ flows }: PlanMigrationChartProps) {
    const data = Object.entries(flows)
        .map(([key, count]) => {
            const { from, to } = parseFlowLabel(key);
            return {
                label: key,
                from,
                to,
                count,
                toColor: PLAN_COLORS[to] || PLAN_COLORS.unknown,
            };
        })
        .sort((a, b) => b.count - a.count);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
                No migration data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    width={120}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        color: '#e4e4e7',
                    }}
                    formatter={(value: number) => [value, 'Transitions']}
                    labelFormatter={(label) => ` ${label}`}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.toColor} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}