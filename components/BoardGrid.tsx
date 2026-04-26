'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Squares2X2Icon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
}

export default function BoardGrid({ workspaceSlug, initialBoards, canEdit }: BoardGridProps) {
    const [boards, setBoards] = useState<Board[]>(initialBoards);

    // Sync state with props when boards change
    useEffect(() => {
        setBoards(initialBoards);
    }, [initialBoards]);

    // Listen for custom event when a board is created
    useEffect(() => {
        const handleBoardCreated = (event: CustomEvent<Board>) => {
            // Add the new board to the list optimistically
            setBoards(prev => [...prev, event.detail]);
        };

        window.addEventListener('board-created' as keyof WindowEventMap, handleBoardCreated as EventListener);
        return () => {
            window.removeEventListener('board-created' as keyof WindowEventMap, handleBoardCreated as EventListener);
        };
    }, []);

    return (
        <>
            {boards.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 mb-6 relative">
                        <div className="absolute -inset-2 rounded-2xl border border-[var(--brand-primary)]/10" />
                        <Squares2X2Icon className="w-8 h-8 text-[var(--brand-primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No boards yet</h2>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto text-sm md:text-base">
                        {canEdit
                            ? 'Create your first board to start organizing tasks. Boards help you categorize your work by project, team, or department.'
                            : 'This workspace doesn\'t have any boards yet. The workspace admin can create boards to start organizing tasks.'}
                    </p>
                    {canEdit && (
                        <p className="text-sm text-[var(--text-secondary)]">
                            Click the <Squares2X2Icon className="w-4 h-4 inline-block mx-1" /> button in the sidebar to create a board.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {boards.map((board, index) => (
                        <Link
                            key={board.id}
                            href={`/${workspaceSlug}/board/${board.slug}`}
                            className="group card p-4 md:p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative overflow-hidden animate-fade-in-up"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            {/* Subtle hover gradient */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                    background: `linear-gradient(135deg, ${board.color}10 0%, transparent 100%)`,
                                }}
                            />

                            <div className="flex items-start gap-3 md:gap-4 relative">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-110"
                                    style={{ backgroundColor: board.color }}
                                >
                                    <Squares2X2Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--brand-primary)] transition-colors truncate text-sm md:text-base">
                                        {board.name}
                                    </h3>
                                    {board.description && (
                                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 hidden sm:block">
                                            {board.description}
                                        </p>
                                    )}
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all flex-shrink-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
