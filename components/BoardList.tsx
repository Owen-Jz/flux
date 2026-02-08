'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Plus, MoreHorizontal, Edit2, Trash2, Loader2 } from 'lucide-react';
import CreateBoardModal from './CreateBoardModal';
import EditBoardModal from './EditBoardModal';
import { deleteBoard } from '@/actions/board';
import { toast } from 'sonner';

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
}

interface BoardListProps {
    workspaceSlug: string;
    boards: Board[];
    currentBoardSlug?: string;
}

export default function BoardList({ workspaceSlug, boards, currentBoardSlug }: BoardListProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleBoardCreated = (boardSlug: string) => {
        router.push(`/${workspaceSlug}/board/${boardSlug}`);
        router.refresh();
    };

    const handleDelete = async (boardSlug: string) => {
        if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;

        setDeletingId(boardSlug);
        try {
            await deleteBoard(workspaceSlug, boardSlug);
            toast.success('Board deleted successfully');
            setOpenMenuId(null);
            if (currentBoardSlug === boardSlug) {
                router.push(`/${workspaceSlug}`);
            }
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete board');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Boards
                    </h3>
                    <button
                        id="board-create-btn"
                        onClick={() => setShowCreateModal(true)}
                        className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                        title="Create new board"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-1">
                    {boards.length === 0 ? (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors border border-dashed border-[var(--border-subtle)]"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Create your first board
                        </button>
                    ) : (
                        boards.map((board) => (
                            <div key={board.id} className="relative group">
                                <Link
                                    href={`/${workspaceSlug}/board/${board.slug}`}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors pr-8 ${currentBoardSlug === board.slug
                                        ? 'bg-[var(--surface)] text-[var(--foreground)] font-medium'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                                        }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-sm flex-shrink-0"
                                        style={{ backgroundColor: board.color }}
                                    />
                                    <span className="truncate flex-1">{board.name}</span>
                                </Link>

                                {/* Dropdown Trigger */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === board.id ? null : board.id);
                                    }}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-all ${openMenuId === board.id ? 'opacity-100 bg-[var(--background)]' : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuId === board.id && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 p-1 flex flex-col"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setEditingBoard(board);
                                                setOpenMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-md text-left"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Board
                                        </button>
                                        <button
                                            onClick={() => handleDelete(board.slug)}
                                            disabled={deletingId === board.slug}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-md text-left transition-colors"
                                        >
                                            {deletingId === board.slug ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Delete Board
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateBoardModal
                    workspaceSlug={workspaceSlug}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleBoardCreated}
                />
            )}

            {editingBoard && (
                <EditBoardModal
                    workspaceSlug={workspaceSlug}
                    board={editingBoard}
                    onClose={() => setEditingBoard(null)}
                    onSuccess={() => {
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}
