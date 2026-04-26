'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Squares2X2Icon,
    UsersIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

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

interface AdminSidebarProps {
    adminName?: string;
    adminRole?: string;
    adminImage?: string;
}

export function AdminSidebar({ adminName = 'Admin', adminRole = 'SUPER_ADMIN', adminImage }: AdminSidebarProps) {
    const pathname = usePathname();

    const isActive = (item: NavItem) => {
        if (item.exact) {
            return pathname === item.href;
        }
        return pathname.startsWith(item.href);
    };

    return (
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
            </nav>

            {/* Admin Info */}
            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                            {adminImage ? (
                                <img src={adminImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                                    {adminName.charAt(0)}
                                </div>
                            )}
                        </div>
                        {/* Status indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{adminName}</p>
                        <p className="text-xs text-zinc-500 truncate">{adminRole.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}