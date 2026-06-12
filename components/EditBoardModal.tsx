'use client';
import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, ArrowPathIcon, Squares2X2Icon, PlusIcon, TrashIcon, PencilIcon, BookmarkSquareIcon, TagIcon, UsersIcon } from '@heroicons/react/24/outline';
import { updateBoard, addCategory, deleteCategory, updateCategory, getBoardCategories } from '@/actions/board';
import BoardAccessSection from './BoardAccessSection';

interface WorkspaceMember {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

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
    /** Current user's role in the workspace. Board access controls are admin-only. */
    userRole?: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
    /**
     * Pre-loaded workspace roster, forwarded to the access tab so it doesn't have
     * to re-fetch members the parent already holds. Optional.
     */
    members?: WorkspaceMember[];
    /** Current user's id — forwarded to the access tab to exclude self from the picker. */
    currentUserId?: string;
    onClose: () => void;
    onSuccess?: () => void;
    onCategoriesChange?: (categories: { id: string; name: string; color: string }[]) => void;
}

const BOARD_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

type TabId = 'details' | 'categories' | 'access';

export default function EditBoardModal({ workspaceSlug, board, userRole, members, currentUserId, onClose, onSuccess, onCategoriesChange }: EditBoardModalProps) {
    const isAdmin = userRole === 'ADMIN';

    const [tab, setTab] = useState<TabId>('details');
    // Tabs keep their state once visited (rendered + hidden) so switching tabs
    // never loses an in-progress edit or triggers a redundant re-fetch.
    const [visited, setVisited] = useState<Set<TabId>>(new Set<TabId>(['details']));

    const [name, setName] = useState(board.name);
    const [description, setDescription] = useState(board.description || '');
    const [color, setColor] = useState(board.color);
    const [categories, setCategories] = useState(board.categories || []);
    // Seeded from props, so the list shows instantly; we only show a spinner when
    // we genuinely have nothing yet and a fetch is in flight.
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoriesFetched, setCategoriesFetched] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6366f1');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [editCatColor, setEditCatColor] = useState('');
    const [isUpdatingCat, setIsUpdatingCat] = useState(false);
    const [error, setError] = useState('');

    // Lazily reconcile categories with the DB the first time the Categories tab is
    // opened. Keeps the modal's initial open instant (no blocking fetch on mount).
    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(categories.length === 0);
        try {
            const freshCategories = await getBoardCategories(workspaceSlug, board.slug);
            setCategories(freshCategories);
            onCategoriesChange?.(freshCategories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            // Keep whatever we were seeded with from props.
        } finally {
            setIsLoadingCategories(false);
            setCategoriesFetched(true);
        }
        // onCategoriesChange / categories.length intentionally excluded — this runs once on tab open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceSlug, board.slug]);

    const goToTab = (next: TabId) => {
        setTab(next);
        setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
        if (next === 'categories' && !categoriesFetched) {
            fetchCategories();
        }
    };

    // Close on Escape — standard modal affordance.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            await updateBoard(workspaceSlug, board.slug, { name, description, color });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setIsAddingCat(true);
        setError('');
        try {
            const newCat = await addCategory(workspaceSlug, board.slug, { name: newCatName, color: newCatColor });
            const updatedCategories = [...categories, newCat];
            setCategories(updatedCategories);
            onCategoriesChange?.(updatedCategories);
            setNewCatName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add category');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete category');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update category');
        } finally {
            setIsUpdatingCat(false);
        }
    };

    const tabs: { id: TabId; label: string; icon: typeof Squares2X2Icon }[] = [
        { id: 'details', label: 'Details', icon: Squares2X2Icon },
        { id: 'categories', label: 'Categories', icon: TagIcon },
        ...(isAdmin ? [{ id: 'access' as TabId, label: 'Access', icon: UsersIcon }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] w-full sm:max-w-lg relative shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] rounded-t-[1.75rem] sm:rounded-[2rem] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-300"
            >
                {/* Header */}
                <div className="flex items-start gap-4 p-5 sm:p-6 pb-4 shrink-0">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"
                        style={{ backgroundColor: color }}
                    >
                        <Squares2X2Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate">Board Settings</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{board.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 -mr-1 -mt-1 rounded-xl hover:bg-[var(--background-subtle)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="px-5 sm:px-6 shrink-0">
                    <div className="flex gap-1 p-1 bg-[var(--background-subtle)] rounded-2xl">
                        {tabs.map((t) => {
                            const active = tab === t.id;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => goToTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        active
                                            ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-5">
                    {/* DETAILS */}
                    <div style={{ display: tab === 'details' ? 'block' : 'none' }}>
                        <form id="board-details-form" onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 ml-1">Board Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)] text-base sm:text-sm"
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
                                    className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)] resize-none min-h-[88px] text-base sm:text-sm"
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
                                            aria-label={`Select color ${c}`}
                                            className={`w-9 h-9 rounded-xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--brand-primary)]/30 scale-110 shadow-lg' : 'hover:scale-105 border border-[var(--surface)] shadow-sm'
                                                }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* CATEGORIES */}
                    {visited.has('categories') && (
                        <div style={{ display: tab === 'categories' ? 'block' : 'none' }}>
                            <p className="text-sm text-[var(--text-secondary)] mb-4 ml-1">Group tasks on this board with colored labels.</p>

                            <div className="grid grid-cols-1 gap-2.5 mb-5">
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
                                                        aria-label="Category color"
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
                                                    className="flex-1 min-w-0 px-3 py-1.5 text-base sm:text-sm bg-[var(--background-subtle)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] text-[var(--text-primary)]"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateCategory}
                                                    disabled={!editCatName.trim() || isUpdatingCat}
                                                    className="p-1.5 text-[var(--flux-success-primary)] hover:bg-[var(--flux-success-bg)] rounded-lg transition-colors disabled:opacity-50"
                                                    aria-label="Save category"
                                                >
                                                    {isUpdatingCat ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BookmarkSquareIcon className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-subtle)] rounded-lg transition-colors"
                                                    aria-label="Cancel edit"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                                                <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">{cat.name}</span>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(cat)}
                                                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--flux-info-bg)] rounded-xl transition-all"
                                                        aria-label={`Edit ${cat.name}`}
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--flux-error-primary)] hover:bg-[var(--flux-error-bg)] rounded-xl transition-all"
                                                        aria-label={`Delete ${cat.name}`}
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
                                {categories.length === 0 && isLoadingCategories && (
                                    <div className="py-8 text-center bg-[var(--background-subtle)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                                        <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto text-[var(--text-tertiary)]" />
                                        <p className="text-sm text-[var(--text-tertiary)] mt-2">Loading categories...</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-[var(--background-subtle)] border border-[var(--border-subtle)] p-4 rounded-[1.5rem] space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                            placeholder="Add new category..."
                                            className="w-full px-4 py-2.5 text-base sm:text-sm bg-[var(--surface)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all font-medium placeholder-[var(--text-tertiary)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="w-12 h-12 relative flex-shrink-0">
                                        <input
                                            type="color"
                                            value={newCatColor}
                                            onChange={(e) => setNewCatColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            aria-label="New category color"
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
                    )}

                    {/* ACCESS (admin only) */}
                    {isAdmin && visited.has('access') && (
                        <div style={{ display: tab === 'access' ? 'block' : 'none' }}>
                            <BoardAccessSection
                                workspaceSlug={workspaceSlug}
                                boardSlug={board.slug}
                                members={members}
                                currentUserId={currentUserId}
                            />
                        </div>
                    )}

                    {error && (
                        <p className="mt-4 text-xs font-bold text-[var(--flux-error-primary)] bg-[var(--flux-error-bg)] px-4 py-3 rounded-xl border border-[var(--flux-error-border)] animate-shake">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer — Details tab saves the board form; other tabs save inline. */}
                <div className="shrink-0 border-t border-[var(--border-subtle)] p-4 sm:px-6 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-base sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {tab === 'details' ? 'Cancel' : 'Close'}
                    </button>
                    {tab === 'details' && (
                        <button
                            type="submit"
                            form="board-details-form"
                            disabled={isLoading || !name.trim()}
                            className="w-full sm:flex-[2] h-11 bg-[var(--brand-primary)] text-white rounded-xl hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 flex items-center justify-center transition-all font-bold text-base sm:text-sm shadow-xl"
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
                    )}
                </div>
            </div>
        </div>
    );
}
