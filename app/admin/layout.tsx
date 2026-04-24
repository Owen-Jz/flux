'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Squares2X2Icon,
    UsersIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

interface AdminUser {
    name: string;
    email: string;
    image?: string;
    role: string;
}

interface AdminContextType {
    admin: AdminUser | null;
}

const AdminContext = createContext<AdminContextType>({ admin: null });

export const useAdmin = () => useContext(AdminContext);

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
}

const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: Squares2X2Icon, exact: true },
    { href: '/admin/users', label: 'Users', icon: UsersIcon },
    { href: '/admin/workspaces', label: 'Workspaces', icon: BuildingOffice2Icon },
    { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    useEffect(() => {
        // Fetch admin session on mount
        fetch('/api/admin/session')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.admin) {
                    setAdmin(data.admin);
                }
            })
            .catch(() => {})
            .finally(() => setMounted(true));
    }, []);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/admin/login' });
    };

    const isActive = (item: NavItem) => {
        if (item.exact) {
            return pathname === item.href;
        }
        return pathname.startsWith(item.href);
    };

    if (!mounted) {
        return (
            <div className="flex h-screen bg-zinc-950 items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AdminContext.Provider value={{ admin }}>
            <div className="flex h-screen bg-zinc-950">
                {/* Sidebar */}
                <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col relative">
                    {/* Subtle glow accent on top border */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

                    {/* Logo */}
                    <div className="p-6 border-b border-zinc-800">
                        <Link href="/admin" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                                <ShieldCheckIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-zinc-50">Flux Admin</h1>
                                <p className="text-xs text-zinc-500">Platform Management</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item, index) => {
                            const active = isActive(item);
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative
                                            ${active
                                                ? 'bg-zinc-800 text-violet-400 shadow-lg shadow-violet-500/10'
                                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                            }
                                        `}
                                    >
                                        {active && (
                                            <>
                                                {/* Active indicator bar */}
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full"
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
                                            </>
                                        )}
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </motion.div>
                            );
                        })}

                    {/* Billing section */}
                    <div className="mt-6 pt-4 border-t border-zinc-800">
                        <p className="px-4 mb-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Billing</p>
                        {[
                            { href: '/admin/billing', label: 'Overview' },
                            { href: '/admin/billing/subscriptions', label: 'Subscriptions' },
                            { href: '/admin/billing/analytics', label: 'Analytics' },
                        ].map((item, index) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative mb-1
                                            ${active
                                                ? 'bg-zinc-800 text-violet-400 shadow-lg shadow-violet-500/10'
                                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                            }
                                        `}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <CreditCardIcon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                    </nav>

                    {/* Admin Info */}
                    <div className="p-4 border-t border-zinc-800">
                        <div className="relative">
                            <button
                                onClick={() => setShowLogout(!showLogout)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                        {admin?.image ? (
                                            <img src={admin.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                                                {admin?.name?.charAt(0) || 'A'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Status indicator */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-semibold text-zinc-200 truncate">
                                        {admin?.name || 'Admin'}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {admin?.role?.replace('_', ' ') || 'Administrator'}
                                    </p>
                                </div>
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                                {showLogout && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl"
                                    >
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </AdminContext.Provider>
    );
}