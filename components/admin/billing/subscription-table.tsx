'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/admin/data-table';
import { PlanBadge, StatusBadge } from './plan-badge';
import { PlanChangeModal } from './plan-change-modal';
import { SubscriptionDrawer } from './subscription-drawer';
import type { SubscriptionRow, PlanType } from '@/lib/types/billing';
import type { Column } from '@/components/admin/data-table';

interface SubscriptionTableProps {
    initialData: {
        rows: SubscriptionRow[];
        total: number;
        page: number;
        totalPages: number;
    };
}

const PLAN_OPTIONS = [
    { value: '', label: 'All Plans' },
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'trialing', label: 'Trialing' },
];

export function SubscriptionTable({ initialData }: SubscriptionTableProps) {
    const searchParams = useSearchParams();

    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const [selectedUser, setSelectedUser] = useState<SubscriptionRow | null>(null);
    const [drawerUser, setDrawerUser] = useState<SubscriptionRow | null>(null);

    const fetchData = useCallback(async (overrides?: {
        page?: number;
        search?: string;
        plan?: string;
        status?: string;
    }) => {
        const params = new URLSearchParams();
        const s = overrides?.search ?? search;
        const p = overrides?.plan ?? planFilter;
        const st = overrides?.status ?? statusFilter;
        const pg = overrides?.page ?? page;

        if (s) params.set('search', s);
        if (p) params.set('plan', p);
        if (st) params.set('status', st);
        params.set('page', String(pg));

        const res = await fetch(`/api/admin/billing/subscriptions?${params}`);
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
    }, [search, planFilter, statusFilter, page]);

    const handleSearch = (term: string) => {
        setSearch(term);
        setPage(1);
        fetchData({ page: 1, search: term });
    };

    const handlePlanFilter = (plan: string) => {
        setPlanFilter(plan);
        setPage(1);
        fetchData({ page: 1, plan });
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPage(1);
        fetchData({ page: 1, status });
    };

    const handleClear = () => {
        setSearch('');
        setPlanFilter('');
        setStatusFilter('');
        setPage(1);
        fetchData({ page: 1, search: '', plan: '', status: '' });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData({ page: newPage });
    };

    const columns: Column[] = [
        { key: 'user', label: 'User', width: '25%' },
        { key: 'plan', label: 'Plan' },
        { key: 'subscriptionStatus', label: 'Status' },
        { key: 'createdAt', label: 'Joined', sortable: true },
        { key: 'actions', label: 'Actions' },
    ];

    const renderRow = (row: SubscriptionRow) => ({
        user: (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                    {row.image
                        ? <img src={row.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">{row.name.charAt(0)}</div>
                    }
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{row.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{row.email}</p>
                </div>
            </div>
        ),
        plan: <PlanBadge plan={row.plan} />,
        subscriptionStatus: <StatusBadge status={row.subscriptionStatus} />,
        createdAt: (
            <span className="text-sm text-zinc-500">
                {new Date(row.createdAt).toLocaleDateString()}
            </span>
        ),
        actions: (
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
                    className="px-3 py-1.5 text-xs font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-colors"
                >
                    Change Plan
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setDrawerUser(row); }}
                    className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                    View History
                </button>
            </div>
        ),
    });

    const hasFilters = search || planFilter || statusFilter;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Search */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSearch(search); }}
                    className="flex-1 max-w-xs relative"
                >
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                    />
                </form>

                {/* Plan filter */}
                <select
                    value={planFilter}
                    onChange={(e) => handlePlanFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                    {PLAN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {hasFilters && (
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Active filter tags */}
            {hasFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    {search && (
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                            Search: {search}
                        </span>
                    )}
                    {planFilter && (
                        <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full capitalize">
                            Plan: {planFilter}
                        </span>
                    )}
                    {statusFilter && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full capitalize">
                            Status: {statusFilter.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}

            {/* Table */}
            <DataTable
                columns={columns}
                data={data.rows.map(r => ({ ...r, ...renderRow(r) }))}
                keyField="id"
                emptyMessage="No subscriptions found"
            />

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                        Showing {((data.page - 1) * 20) + 1}–{Math.min(data.page * 20, data.total)} of {data.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(data.page - 1)}
                            disabled={data.page <= 1}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-zinc-500">
                            Page {data.page} of {data.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(data.page + 1)}
                            disabled={data.page >= data.totalPages}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedUser && (
                <PlanChangeModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={() => { setSelectedUser(null); fetchData(); }}
                />
            )}

            {drawerUser && (
                <SubscriptionDrawer
                    user={drawerUser}
                    onClose={() => setDrawerUser(null)}
                    onUpdated={() => { setDrawerUser(null); fetchData(); }}
                />
            )}
        </div>
    );
}