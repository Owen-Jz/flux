'use client';

import { useState, useCallback } from 'react';
import { XMarkIcon, PhotoIcon, FaceSmileIcon, ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { updateWorkspaceSettings } from '@/actions/workspace';

const EMOJI_CATEGORIES = [
    {
        name: 'Faces',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕'],
    },
    {
        name: 'Objects',
        emojis: ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '💾', '💿', '📀', '🧮', '📣', '📝', '✏️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📧', '📨', '📩', '📤', '📥', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮'],
    },
    {
        name: 'Symbols',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '❄️', '🌈', '☀️', '🌤️', '⛅', '🌩️', '🌊', '💧', '🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️'],
    },
    {
        name: 'Nature',
        emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🌵', '🎄', '🌲', '🌳', '🌴', '🎋', '🎍', '🎎', '🌼', '🎐', '🎑'],
    },
    {
        name: 'Activities',
        emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴'],
    },
];

interface WorkspaceIconPickerProps {
    workspaceSlug: string;
    currentIcon?: {
        type: 'upload' | 'emoji';
        url?: string;
        emoji?: string;
    };
    onClose: () => void;
    onIconChange?: () => void;
}

export function WorkspaceIconPicker({
    workspaceSlug,
    currentIcon,
    onClose,
    onIconChange,
}: WorkspaceIconPickerProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'emoji'>(
        currentIcon?.type === 'upload' ? 'upload' : 'emoji'
    );
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
        currentIcon?.type === 'emoji' ? currentIcon.emoji || null : null
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        currentIcon?.type === 'upload' ? currentIcon.url || null : null
    );
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('File size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setPreviewUrl(event.target?.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            if (activeTab === 'emoji' && selectedEmoji) {
                await updateWorkspaceSettings(workspaceSlug, {
                    icon: {
                        type: 'emoji',
                        emoji: selectedEmoji,
                    },
                });
            } else if (activeTab === 'upload' && previewUrl) {
                // For now, we'll store the data URL directly since we don't have a server upload endpoint set up
                // In production, you'd upload to UploadThing first and get a URL
                await updateWorkspaceSettings(workspaceSlug, {
                    icon: {
                        type: 'upload',
                        url: previewUrl,
                    },
                });
            } else {
                await updateWorkspaceSettings(workspaceSlug, { icon: null });
            }
            onIconChange?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save icon');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveIcon = async () => {
        setIsSaving(true);
        setError(null);

        try {
            await updateWorkspaceSettings(workspaceSlug, { icon: null });
            onIconChange?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove icon');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Change Workspace Icon</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--background-subtle)] hover:text-[var(--text-primary)]"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-subtle)]">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'upload'
                                ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        <PhotoIcon className="w-4 h-4" />
                        Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('emoji')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'emoji'
                                ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        <FaceSmileIcon className="w-4 h-4" />
                        Emoji
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-80 overflow-y-auto">
                    {error && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg border border-[var(--flux-error-border)] bg-[var(--flux-error-bg)] p-3 text-sm text-[var(--flux-error-text-strong)]"
                        >
                            {error}
                        </div>
                    )}

                    {activeTab === 'upload' ? (
                        <div className="space-y-4">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-24 h-24 rounded-xl object-cover mx-auto"
                                    />
                                    <button
                                        onClick={() => setPreviewUrl(null)}
                                        aria-label="Remove uploaded image"
                                        className="absolute top-0 right-1/2 translate-x-10 -translate-y-2 rounded-full bg-[var(--flux-error-primary)] p-1 text-white"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <label className="block">
                                    <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--brand-primary)] transition-colors">
                                        <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                            PNG, JPG, SVG, WebP (max 2MB)
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {EMOJI_CATEGORIES.map((category) => (
                                <div key={category.name}>
                                    <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
                                        {category.name}
                                    </h3>
                                    <div className="grid grid-cols-8 gap-1">
                                        {category.emojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => setSelectedEmoji(emoji)}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-colors ${
                                                    selectedEmoji === emoji
                                                        ? 'bg-[var(--brand-primary)] text-white'
                                                        : 'hover:bg-[var(--background)]'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--background-subtle)] p-4">
                    <button
                        onClick={handleRemoveIcon}
                        disabled={isSaving || !currentIcon}
                        className="text-sm font-medium text-[var(--flux-error-primary)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Remove icon
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (activeTab === 'upload' && !previewUrl) || (activeTab === 'emoji' && !selectedEmoji)}
                            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
