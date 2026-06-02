'use client';

import { useMemo, useState } from 'react';
import { WorkspaceCard } from './WorkspaceCard';
import { SearchInput } from '@/components/ui/search-input';

export interface WorkspaceBrowserItem {
    id: string;
    name: string;
    slug: string;
    accentColor?: string;
    icon?: { type: 'upload' | 'emoji'; url?: string; emoji?: string };
    memberCount: number;
    boardCount: number;
    /** ISO string — serialized across the server/client boundary. */
    lastActiveAt: string;
    hasUnread: boolean;
}

type SortKey = 'recent' | 'name' | 'boards';

interface WorkspaceBrowserProps {
    workspaces: WorkspaceBrowserItem[];
    userPlan: string;
}

/**
 * Client-side index over the user's workspaces: search by name/slug and sort.
 * The toolbar only appears once there are enough workspaces to warrant it,
 * keeping small accounts uncluttered while staying useful at scale.
 */
export function WorkspaceBrowser({ workspaces, userPlan }: WorkspaceBrowserProps) {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<SortKey>('recent');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = q
            ? workspaces.filter(
                  (w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q)
              )
            : [...workspaces];

        list.sort((a, b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            if (sort === 'boards') return b.boardCount - a.boardCount;
            return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
        });
        return list;
    }, [workspaces, query, sort]);

    const showToolbar = workspaces.length > 4;

    return (
        <section aria-label="Your workspaces">
            {showToolbar && (
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder="Search workspaces…"
                        ariaLabel="Search workspaces"
                        className="sm:max-w-xs"
                    />
                    <div className="flex items-center gap-2">
                        <label htmlFor="ws-sort" className="text-xs font-medium text-[var(--text-tertiary)]">
                            Sort
                        </label>
                        <select
                            id="ws-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                        >
                            <option value="recent">Recently active</option>
                            <option value="name">Name (A–Z)</option>
                            <option value="boards">Most boards</option>
                        </select>
                    </div>
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] py-16 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                        No workspaces match &ldquo;{query}&rdquo;.
                    </p>
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="mt-3 text-sm font-medium text-[var(--brand-primary)] hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((w, index) => (
                        <li
                            key={w.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                        >
                            <WorkspaceCard
                                name={w.name}
                                slug={w.slug}
                                accentColor={w.accentColor}
                                icon={w.icon}
                                memberCount={w.memberCount}
                                boardCount={w.boardCount}
                                lastActiveAt={w.lastActiveAt}
                                hasUnread={w.hasUnread}
                                userPlan={userPlan}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {showToolbar && query && filtered.length > 0 && (
                <p className="mt-4 text-xs text-[var(--text-tertiary)]" role="status">
                    Showing {filtered.length} of {workspaces.length} workspaces
                </p>
            )}
        </section>
    );
}
