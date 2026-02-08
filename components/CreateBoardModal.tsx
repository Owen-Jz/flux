'use client';

import { useState } from 'react';
import { X, Loader2, LayoutGrid } from 'lucide-react';
import { createBoard } from '@/actions/board';

interface CreateBoardModalProps {
    workspaceSlug: string;
    onClose: () => void;
    onSuccess?: (boardSlug: string) => void;
}

const BOARD_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];

export default function CreateBoardModal({ workspaceSlug, onClose, onSuccess }: CreateBoardModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(BOARD_COLORS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const result = await createBoard(workspaceSlug, { name, description, color });
            onSuccess?.(result.slug);
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
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Create New Board</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Create a board to organize tasks by category (e.g., Marketing, Finance, Development).
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Board Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Marketing, Finance, Development"
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all placeholder-[var(--text-secondary)]/50"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this board's purpose..."
                            rows={2}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all placeholder-[var(--text-secondary)]/50 resize-none"
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <LayoutGrid className="w-4 h-4" />
                                    Create Board
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
