'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Squares2X2Icon, ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import CreateBoardModal from '@/components/CreateBoardModal';
import { SearchInput } from '@/components/ui/search-input';
import type { BoardTaskStat } from '@/actions/board';

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
}

interface BoardGridProps {
    workspaceSlug: string;
    initialBoards: Board[];
    canEdit: boolean;
    /** Per-board task rollup keyed by board id. */
    boardStats?: Record<string, BoardTaskStat>;
}

export default function BoardGrid({ workspaceSlug, initialBoards, canEdit, boardStats }: BoardGridProps) {
    const [boards, setBoards] = useState<Board[]>(initialBoards);
    const [query, setQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Sync state with props when boards change
    useEffect(() => {
        setBoards(initialBoards);
    }, [initialBoards]);

    // Listen for custom event when a board is created (from the sidebar or elsewhere)
    useEffect(() => {
        const handleBoardCreated = (event: CustomEvent<Board>) => {
            setBoards((prev) =>
                prev.some((b) => b.id === event.detail.id) ? prev : [...prev, event.detail]
            );
        };

        window.addEventListener('board-created' as keyof WindowEventMap, handleBoardCreated as EventListener);
        return () => {
            window.removeEventListener('board-created' as keyof WindowEventMap, handleBoardCreated as EventListener);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return boards;
        return boards.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                (b.description ? b.description.toLowerCase().includes(q) : false)
        );
    }, [boards, query]);

    const showToolbar = boards.length > 4 || canEdit;

    // ----- Empty workspace (no boards at all) -----
    if (boards.length === 0) {
        return (
            <>
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-16 text-center">
                    <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10">
                        <div className="absolute -inset-2 rounded-2xl border border-[var(--brand-primary)]/10" />
                        <Squares2X2Icon className="h-8 w-8 text-[var(--brand-primary)]" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">No boards yet</h2>
                    <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)] md:text-base">
                        {canEdit
                            ? 'Boards organize your work by project, team, or department. Create your first to start adding tasks.'
                            : "This workspace doesn't have any boards yet. An admin can create boards to start organizing tasks."}
                    </p>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="btn btn-primary btn-lg inline-flex items-center gap-2 shadow-lg shadow-[var(--brand-primary)]/20"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create your first board
                        </button>
                    )}
                </div>
                {isCreateOpen && (
                    <CreateBoardModal workspaceSlug={workspaceSlug} onClose={() => setIsCreateOpen(false)} />
                )}
            </>
        );
    }

    return (
        <>
            {showToolbar && (
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {boards.length > 4 ? (
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder="Search boards…"
                            ariaLabel="Search boards"
                            className="sm:max-w-xs"
                        />
                    ) : (
                        <span />
                    )}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="btn btn-primary inline-flex items-center gap-2 self-start shadow-lg shadow-[var(--brand-primary)]/20 sm:self-auto"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New board
                        </button>
                    )}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-default)] py-16 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">No boards match &ldquo;{query}&rdquo;.</p>
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="mt-3 text-sm font-medium text-[var(--brand-primary)] hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <ul aria-label="Boards" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
                    {filtered.map((board, index) => {
                        const stats = boardStats?.[board.id];
                        const total = stats?.total ?? 0;
                        const done = stats?.done ?? 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                            <li key={board.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
                                <Link
                                    href={`/${workspaceSlug}/board/${board.slug}`}
                                    aria-label={`Open ${board.name} board${total > 0 ? ` — ${done} of ${total} tasks done` : ''}`}
                                    className="card group relative block h-full overflow-hidden p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:p-5"
                                >
                                    <div
                                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                        style={{ background: `linear-gradient(135deg, ${board.color}10 0%, transparent 100%)` }}
                                    />

                                    <div className="relative flex items-start gap-3 md:gap-4">
                                        <div
                                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg shadow-md transition-transform duration-200 group-hover:scale-110"
                                            style={{ backgroundColor: board.color }}
                                        >
                                            <Squares2X2Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)] md:text-base">
                                                {board.name}
                                            </h3>
                                            {board.description && (
                                                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                                                    {board.description}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowRightIcon className="h-5 w-5 flex-shrink-0 -translate-x-1 text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                                    </div>

                                    {/* Task progress */}
                                    <div className="relative mt-4 border-t border-[var(--border-subtle)] pt-3">
                                        {total > 0 ? (
                                            <>
                                                <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                                                    <span>
                                                        {done}/{total} done
                                                    </span>
                                                    <span className="tabular-nums">{pct}%</span>
                                                </div>
                                                <div
                                                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--background-subtle)]"
                                                    role="progressbar"
                                                    aria-valuenow={pct}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-label={`${board.name} progress`}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-[width] duration-500"
                                                        style={{ width: `${pct}%`, backgroundColor: board.color }}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-[var(--text-tertiary)]">No tasks yet</p>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {isCreateOpen && (
                <CreateBoardModal workspaceSlug={workspaceSlug} onClose={() => setIsCreateOpen(false)} />
            )}
        </>
    );
}
