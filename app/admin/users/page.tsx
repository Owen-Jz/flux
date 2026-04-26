'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUsers } from '@/actions/admin/users';
import { MagnifyingGlassIcon, ShieldCheckIcon, TrashIcon, PauseCircleIcon, CreditCardIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserActionButton } from '@/components/admin/user-actions';
import { EllipsisVerticalIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    plan: string | null;
    subscriptionStatus: string | null;
    createdAt: string | null;
}

function UserActions({ userId, userEmail }: { userId: string; userEmail: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-50"
                    >
                        <UserActionButton
                            userId={userId}
                            action="view"
                            label="View Details"
                            icon={ShieldCheckIcon}
                        />
                        <UserActionButton
                            userId={userId}
                            action="change-plan"
                            label="Change Plan"
                            icon={CreditCardIcon}
                        />
                        <UserActionButton
                            userId={userId}
                            action="suspend"
                            label="Suspend User"
                            icon={PauseCircleIcon}
                        />
                        <UserActionButton
                            userId={userId}
                            action="delete"
                            label="Delete User"
                            icon={TrashIcon}
                            destructive
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AnimatedSkeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />;
}

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';

    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            try {
                const result = await getAllUsers({
                    page,
                    limit: 20,
                    search,
                    plan: plan || undefined,
                });
                setUsers(result.users as any);
                setTotal(result.total);
                setPages(result.pages);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [page, search, plan]);

    const handleSearch = (formData: FormData) => {
        const search = formData.get('search') as string;
        const plan = formData.get('plan') as string;
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (plan) params.set('plan', plan);
        router.push(`/admin/users?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/admin/users');
    };

    const hasActiveFilters = search || plan;

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Users</h1>
                    <p className="text-zinc-500">Manage platform users</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    {total.toLocaleString()} total users
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <form action={handleSearch} className="flex items-center gap-4">
                    <div className="flex-1 max-w-md relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search users..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 bg-zinc-900 border ${showFilters ? 'border-violet-500/50' : 'border-zinc-800'} rounded-xl text-zinc-300 hover:border-zinc-700 transition-all`}
                        >
                            <FunnelIcon className="w-4 h-4" />
                            Filters
                            {plan && <span className="w-2 h-2 rounded-full bg-violet-500" />}
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl p-2 z-50 shadow-xl"
                                >
                                    <select
                                        name="plan"
                                        defaultValue={plan}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-violet-500/50"
                                    >
                                        <option value="">All Plans</option>
                                        <option value="free">Free</option>
                                        <option value="starter">Starter</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20"
                    >
                        Search
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </form>

                {/* Active filters */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mt-3"
                        >
                            {search && (
                                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full flex items-center gap-1">
                                    Search: {search}
                                </span>
                            )}
                            {plan && (
                                <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-sm rounded-full capitalize flex items-center gap-1">
                                    Plan: {plan}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3">
                                <AnimatedSkeleton className="w-10 h-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <AnimatedSkeleton className="h-4 w-32" />
                                    <AnimatedSkeleton className="h-3 w-48" />
                                </div>
                                <AnimatedSkeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-zinc-800/50 border-b border-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {users.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-zinc-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden group-hover:ring-2 group-hover:ring-violet-500/50 transition-all">
                                                    {user.image ? (
                                                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                                                            {user.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-zinc-200 group-hover:text-zinc-50 transition-colors">{user.name || 'Unknown'}</p>
                                                    <p className="text-sm text-zinc-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
                                                {user.plan || 'free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.subscriptionStatus === 'active' ? (
                                                <span className="flex items-center gap-2 text-xs font-medium text-green-400">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                                                    {user.subscriptionStatus || 'N/A'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <UserActions userId={user.id} userEmail={user.email} />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {users.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-zinc-600" />
                                </div>
                                <p className="text-zinc-500">No users found</p>
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            {/* Pagination */}
            <AnimatePresence>
                {pages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex items-center justify-center gap-2 mt-6"
                    >
                        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    params.set('page', p.toString());
                                    if (search) params.set('search', search);
                                    if (plan) params.set('plan', plan);
                                    router.push(`/admin/users?${params.toString()}`);
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                                    p === page
                                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}