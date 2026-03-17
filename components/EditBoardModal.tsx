'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon, Squares2X2Icon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, BookmarkSquareIcon } from '@heroicons/react/24/outline';
import { updateBoard, addCategory, deleteCategory, updateCategory, getBoardCategories } from '@/actions/board';

interface EditBoardModalProps {
    workspaceSlug: string;
    board: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        color: string;
        categories?: { id: string; name: string; color: string }[];
    };
    onClose: () => void;
    onSuccess?: () => void;
    onCategoriesChange?: (categories: { id: string; name: string; color: string }[]) => void;
}

const BOARD_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function EditBoardModal({ workspaceSlug, board, onClose, onSuccess, onCategoriesChange }: EditBoardModalProps) {
    const [name, setName] = useState(board.name);
    const [description, setDescription] = useState(board.description || '');
    const [color, setColor] = useState(board.color);
    const [categories, setCategories] = useState(board.categories || []);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6366f1');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [editCatColor, setEditCatColor] = useState('');
    const [isUpdatingCat, setIsUpdatingCat] = useState(false);
    const [error, setError] = useState('');

    // Fetch categories directly from DB on mount to ensure fresh data
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const freshCategories = await getBoardCategories(workspaceSlug, board.slug);
                setCategories(freshCategories);
                onCategoriesChange?.(freshCategories);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
                // Fall back to prop value
                setCategories(board.categories || []);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [workspaceSlug, board.slug]);

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

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setIsAddingCat(true);
        try {
            const newCat = await addCategory(workspaceSlug, board.slug, { name: newCatName, color: newCatColor });
            const updatedCategories = [...categories, newCat];
            setCategories(updatedCategories);
            onCategoriesChange?.(updatedCategories);
            setNewCatName('');
        } catch (err: any) {
            setError(err.message || 'Failed to add category');
        } finally {
            setIsAddingCat(false);
        }
    };

    const handleDeleteCategory = async (catId: string) => {
        try {
            await deleteCategory(workspaceSlug, board.slug, catId);
            const updatedCategories = categories.filter(c => c.id !== catId);
            setCategories(updatedCategories);
            onCategoriesChange?.(updatedCategories);
        } catch (err: any) {
            setError(err.message || 'Failed to delete category');
        }
    };

    const handleStartEdit = (cat: { id: string; name: string; color: string }) => {
        setEditingCatId(cat.id);
        setEditCatName(cat.name);
        setEditCatColor(cat.color);
    };

    const handleCancelEdit = () => {
        setEditingCatId(null);
        setEditCatName('');
        setEditCatColor('');
    };

    const handleUpdateCategory = async () => {
        if (!editingCatId || !editCatName.trim()) return;
        setIsUpdatingCat(true);
        try {
            await updateCategory(workspaceSlug, board.slug, editingCatId, {
                name: editCatName,
                color: editCatColor
            });

            const updatedCategories = categories.map(c =>
                c.id === editingCatId
                    ? { ...c, name: editCatName, color: editCatColor }
                    : c
            );
            setCategories(updatedCategories);
            onCategoriesChange?.(updatedCategories);

            handleCancelEdit();
        } catch (err: any) {
            setError(err.message || 'Failed to update category');
        } finally {
            setIsUpdatingCat(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl hover:bg-[var(--background-subtle)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
                            style={{ backgroundColor: color }}
                        >
                            <Squares2X2Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">Board Settings</h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">Configure your board details and categories</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 ml-1">Board Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)]"
                                required
                                placeholder="E.g., Marketing Campaign"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 ml-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)] resize-none min-h-[100px]"
                                placeholder="Describe the purpose of this board..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 ml-1">Theme Color</label>
                            <div className="flex flex-wrap gap-2.5">
                                {BOARD_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-9 h-9 rounded-xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-[var(--brand-primary)]/20 scale-110 shadow-lg' : 'hover:scale-105 border border-[var(--surface)] shadow-sm'
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-subtle)]">
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-4 ml-1">Task Categories</label>

                        <div className="grid grid-cols-1 gap-2.5 mb-6">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm group hover:border-[var(--border-default)] transition-all">
                                    {editingCatId === cat.id ? (
                                        <div className="flex-1 flex gap-2 items-center">
                                            <div className="relative w-8 h-8 flex-shrink-0">
                                                <input
                                                    type="color"
                                                    value={editCatColor}
                                                    onChange={(e) => setEditCatColor(e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-full rounded-full border-2 border-[var(--surface)] shadow-sm"
                                                    style={{ backgroundColor: editCatColor }}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={editCatName}
                                                onChange={(e) => setEditCatName(e.target.value)}
                                                className="flex-1 px-3 py-1.5 text-sm bg-[var(--background-subtle)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] text-[var(--text-primary)]"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUpdateCategory}
                                                disabled={!editCatName.trim() || isUpdatingCat}
                                                className="p-1.5 text-[var(--flux-success-primary)] hover:bg-[var(--flux-success-bg)] rounded-lg transition-colors"
                                            >
                                                {isUpdatingCat ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BookmarkSquareIcon className="w-4 h-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-subtle)] rounded-lg transition-colors"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                                            <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">{cat.name}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(cat)}
                                                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--flux-info-bg)] rounded-xl transition-all"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--flux-error-primary)] hover:bg-[var(--flux-error-bg)] rounded-xl transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {categories.length === 0 && !isLoadingCategories && (
                                <div className="py-8 text-center bg-[var(--background-subtle)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                                    <p className="text-sm text-[var(--text-tertiary)]">No categories created yet</p>
                                </div>
                            )}
                            {isLoadingCategories && (
                                <div className="py-8 text-center bg-[var(--background-subtle)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                                    <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto text-[var(--text-tertiary)]" />
                                    <p className="text-sm text-[var(--text-tertiary)] mt-2">Loading categories...</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-[var(--background-subtle)] border border-[var(--border-subtle)] p-4 rounded-[1.5rem] space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        placeholder="Add new category..."
                                        className="w-full px-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div className="w-12 h-12 relative flex-shrink-0">
                                    <input
                                        type="color"
                                        value={newCatColor}
                                        onChange={(e) => setNewCatColor(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div
                                        className="w-full h-full rounded-xl border-4 border-[var(--surface)] shadow-md transition-transform hover:scale-105"
                                        style={{ backgroundColor: newCatColor }}
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                disabled={!newCatName.trim() || isAddingCat}
                                className="w-full h-11 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center transition-all font-bold text-sm shadow-lg"
                            >
                                {isAddingCat ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4 mr-2" />}
                                {isAddingCat ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs font-bold text-[var(--flux-error-primary)] bg-[var(--flux-error-bg)] px-4 py-3 rounded-xl border border-[var(--flux-error-border)] animate-shake">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="flex-[2] h-11 bg-[var(--brand-primary)] text-white rounded-xl hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 flex items-center justify-center transition-all font-bold text-sm shadow-xl"
                        >
                            {isLoading ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
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
