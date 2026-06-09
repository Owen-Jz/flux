'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cog6ToothIcon,
    UsersIcon,
    ChevronDownIcon,
    PlusIcon,
    CheckIcon,
    ArrowRightOnRectangleIcon,
    ArchiveBoxIcon,
    InboxIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from './theme-toggle';
import BoardList from './BoardList';
import { OnboardingChecklist } from './onboarding/onboarding-checklist';

interface Workspace {
    id: string;
    name: string;
    slug: string;
    icon?: {
        type: 'upload' | 'emoji';
        url?: string;
        emoji?: string;
    };
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

    // Derive the active board from the URL so the board list highlights the board
    // you're currently on. The server layout does not thread `currentBoardSlug`
    // down, so without this the highlight never activates. Pattern matches
    // `/{workspace}/board/{boardSlug}` and ignores any query/hash suffix.
    const boardSlugFromPath = pathname?.match(/^\/[^/]+\/board\/([^/?#]+)/)?.[1];
    const activeBoardSlug = currentBoardSlug ?? boardSlugFromPath;

    const navItems = [
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/analytics` : '/dashboard',
            label: 'Analytics',
            icon: ChartBarIcon,
            show: true,
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/calendar` : '/dashboard',
            label: 'Calendar',
            icon: CalendarDaysIcon,
            show: true,
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/team` : '/dashboard',
            label: 'Team',
            icon: UsersIcon,
            show: true,
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/issues` : '/dashboard',
            label: 'Feedback',
            icon: InboxIcon,
            show: true,
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/settings` : '/dashboard',
            label: 'Settings',
            icon: Cog6ToothIcon,
            show: isAdmin, // Only show settings to admin
        },
        {
            href: currentWorkspace ? `/${currentWorkspace.slug}/archive` : '/dashboard',
            label: 'Archive',
            icon: ArchiveBoxIcon,
            show: true,
        },
    ].filter(item => item.show);

    return (
        <aside className="w-64 h-screen bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
            {/* Workspace Switcher */}
            <div id="sidebar-workspace-switcher" className="p-4 border-b border-[var(--border-subtle)]">
                <button
                    onClick={() => setIsWorkspaceSwitcherOpen(!isWorkspaceSwitcherOpen)}
                    aria-expanded={isWorkspaceSwitcherOpen}
                    aria-haspopup="true"
                    aria-label="Switch workspace"
                    className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-lg hover:bg-[var(--background)] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {currentWorkspace?.icon?.type === 'emoji' ? (
                            <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-xl">
                                {currentWorkspace.icon.emoji}
                            </div>
                        ) : currentWorkspace?.icon?.type === 'upload' ? (
                            <Image
                                src={currentWorkspace.icon.url || ''}
                                alt=""
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center font-semibold text-sm">
                                {currentWorkspace?.name.charAt(0).toUpperCase() || 'F'}
                            </div>
                        )}
                        <span className="font-medium text-sm truncate max-w-[120px]">
                            {currentWorkspace?.name || 'Select Workspace'}
                        </span>
                    </div>
                    <ChevronDownIcon
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
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-3 p-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
                                    onClick={() => setIsWorkspaceSwitcherOpen(false)}
                                >
                                    <div className="w-6 h-6 rounded bg-[var(--background)] flex items-center justify-center">
                                        <Squares2X2Icon className="w-4 h-4" />
                                    </div>
                                    <span className="truncate flex-1">All workspaces</span>
                                </Link>
                                <div className="my-1 border-t border-[var(--border-subtle)]" />
                                {workspaces.map((workspace) => (
                                    <Link
                                        key={workspace.id}
                                        href={`/${workspace.slug}`}
                                        className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${workspace.slug === currentWorkspace?.slug
                                            ? 'bg-[rgba(var(--brand-primary-rgb),0.1)] font-medium text-[var(--foreground)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--background)]'
                                            }`}
                                        onClick={() => setIsWorkspaceSwitcherOpen(false)}
                                    >
                                        {workspace.icon?.type === 'emoji' ? (
                                            <div className="w-6 h-6 rounded bg-[var(--background)] flex items-center justify-center text-sm">
                                                {workspace.icon.emoji}
                                            </div>
                                        ) : workspace.icon?.type === 'upload' ? (
                                            <Image
                                                src={workspace.icon.url || ''}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium">
                                                {workspace.name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="truncate flex-1">{workspace.name}</span>
                                        {workspace.slug === currentWorkspace?.slug && (
                                            <CheckIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                        )}
                                    </Link>
                                ))}
                                <Link
                                    href="/onboarding"
                                    className="flex items-center gap-3 p-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
                                >
                                    <div className="w-6 h-6 rounded border border-dashed border-[var(--border-subtle)] flex items-center justify-center">
                                        <PlusIcon className="w-3 h-3" />
                                    </div>
                                    <span>New workspace</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Onboarding Checklist */}
            {currentWorkspace && (
                <OnboardingChecklist workspaceSlug={currentWorkspace.slug} />
            )}

            {/* Boards */}
            {currentWorkspace && (
                <div id="sidebar-board-list">
                    <BoardList
                        workspaceSlug={currentWorkspace.slug}
                        boards={boards}
                        currentBoardSlug={activeBoardSlug}
                        userRole={userRole}
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
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
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

            {/* Theme Toggle */}
            <div className="px-4 py-2">
                <ThemeToggle className="w-full" />
            </div>

            {/* User */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    {user.image ? (
                        <Image
                            src={user.image}
                            alt={user.name || ''}
                            width={32}
                            height={32}
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
                        className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors flex items-center justify-center"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
