'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, ArrowPathIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { createWorkspace } from '@/actions/workspace';

interface CreateWorkspaceModalProps {
    onClose: () => void;
    onSuccess?: (slug: string) => void;
}

export default function CreateWorkspaceModal({ onClose, onSuccess }: CreateWorkspaceModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNameChange = (value: string) => {
        setName(value);
        // Auto-generate slug from name
        setSlug(value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const result = await createWorkspace({ name, slug });
            onSuccess?.(result.slug);
            onClose();
            router.push(`/${result.slug}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--flux-brand-primary)] to-[var(--flux-brand-secondary)] flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Create New Workspace</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Workspaces help you organize projects, boards, and tasks for different teams or purposes.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                            Workspace name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g., Acme Inc., Marketing Team"
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all placeholder-[var(--text-secondary)]/50"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                            Workspace URL
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-[var(--background)] rounded-lg border border-[var(--border-subtle)]">
                            <span className="text-[var(--text-secondary)] text-sm">
                                flux.com/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) =>
                                    setSlug(e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9-]/g, '')
                                        .substring(0, 30)
                                    )
                                }
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[var(--foreground)]"
                                placeholder="acme-inc"
                                required
                            />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                            This will be your workspace&apos;s unique URL
                        </p>
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
                            disabled={isLoading || !name.trim() || !slug.trim()}
                            className="px-4 py-2 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-[var(--brand-primary)]/20"
                        >
                            {isLoading ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <BuildingOffice2Icon className="w-4 h-4" />
                                    Create Workspace
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}