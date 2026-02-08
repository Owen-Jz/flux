'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, LayoutGrid } from 'lucide-react';
import { updateBoard } from '@/actions/board';

interface EditBoardModalProps {
    workspaceSlug: string;
    board: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        color: string;
    };
    onClose: () => void;
    onSuccess?: () => void;
}

const BOARD_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function EditBoardModal({ workspaceSlug, board, onClose, onSuccess }: EditBoardModalProps) {
    const [name, setName] = useState(board.name);
    const [description, setDescription] = useState(board.description || '');
    const [color, setColor] = useState(board.color);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            await updateBoard(workspaceSlug, board.slug, { name, description, color });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: color }}
                        >
                            <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Edit Board</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Board Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {BOARD_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--foreground)] scale-110' : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-[var(--brand-primary)]/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
