'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Users,
    ChevronDown,
    Plus,
    Check,
    LogOut,
    Archive,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import BoardList from './BoardList';

interface Workspace {
    id: string;
    name: string;
    slug: string;
}

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
}

interface SidebarProps {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    boards: Board[];
    currentBoardSlug?: string;
    userRole?: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Sidebar({ workspaces, currentWorkspace, boards, currentBoardSlug, userRole, user }: SidebarProps) {
    const pathname = usePathname();
    const [isWorkspaceSwitcherOpen, setIsWorkspaceSwitcherOpen] = useState(false);

    const isAdmin = userRole === 'ADMIN';

    const navItems = [
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/team` : '/dashboard',
            label: 'Team',
            icon: Users,
            show: true,
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/settings` : '/dashboard',
            label: 'Settings',
            icon: Settings,
            show: isAdmin, // Only show settings to admin
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/archive` : '/dashboard',
            label: 'Archive',
            icon: Archive,
            show: true,
        },
    ].filter(item => item.show);

    return (
        <aside className="w-64 h-screen bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
            {/* Workspace Switcher */}
            <div id="sidebar-workspace-switcher" className="p-4 border-b border-[var(--border-subtle)]">
                <button
                    onClick={() => setIsWorkspaceSwitcherOpen(!isWorkspaceSwitcherOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--background)] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center font-semibold text-sm">
                            {currentWorkspace?.name.charAt(0).toUpperCase() || 'F'}
                        </div>
                        <span className="font-medium text-sm truncate max-w-[120px]">
                            {currentWorkspace?.name || 'Select Workspace'}
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isWorkspaceSwitcherOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                <AnimatePresence>
                    {isWorkspaceSwitcherOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 space-y-1">
                                {workspaces.map((workspace) => (
                                    <Link
                                        key={workspace.id}
                                        href={`/${workspace.slug}`}
                                        className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${workspace.slug === currentWorkspace?.slug
                                            ? 'bg-[var(--background)] text-[var(--foreground)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--background)]'
                                            }`}
                                        onClick={() => setIsWorkspaceSwitcherOpen(false)}
                                    >
                                        <div className="w-6 h-6 rounded bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium">
                                            {workspace.name.charAt(0)}
                                        </div>
                                        <span className="truncate flex-1">{workspace.name}</span>
                                        {workspace.slug === currentWorkspace?.slug && (
                                            <Check className="w-4 h-4 text-[var(--brand-primary)]" />
                                        )}
                                    </Link>
                                ))}
                                <Link
                                    href="/onboarding"
                                    className="flex items-center gap-3 p-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
                                >
                                    <div className="w-6 h-6 rounded border border-dashed border-[var(--border-subtle)] flex items-center justify-center">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                    <span>New workspace</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Boards */}
            {currentWorkspace && (
                <div id="sidebar-board-list">
                    <BoardList
                        workspaceSlug={currentWorkspace.slug}
                        boards={boards}
                        currentBoardSlug={currentBoardSlug}
                    />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 border-t border-[var(--border-subtle)]">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        let id = '';
                        if (item.label === 'Team') id = 'sidebar-nav-team';
                        if (item.label === 'Archive') id = 'sidebar-nav-archive';
                        if (item.label === 'Settings') id = 'sidebar-nav-settings';

                        return (
                            <li key={item.href}>
                                <Link
                                    id={id}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || ''}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-sm font-medium">
                            {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                            {user.email}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
