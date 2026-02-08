'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings as SettingsIcon, Globe, Shield, Trash2, Loader2 } from 'lucide-react';
import { updateWorkspaceSettings } from '@/actions/workspace';
import { deleteWorkspace } from '@/actions/access-control';

interface SettingsClientProps {
    workspace: {
        name: string;
        slug: string;
        publicAccess: boolean;
    };
}

export function SettingsClient({ workspace }: SettingsClientProps) {
    const router = useRouter();
    const [publicAccess, setPublicAccess] = useState(workspace.publicAccess);
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleTogglePublicAccess = async () => {
        const newValue = !publicAccess;
        setPublicAccess(newValue);

        startTransition(async () => {
            try {
                await updateWorkspaceSettings(workspace.slug, { publicAccess: newValue });
            } catch (error) {
                console.error('Failed to update settings:', error);
                setPublicAccess(!newValue); // Revert on error
            }
        });
    };

    const handleDeleteWorkspace = async () => {
        if (deleteConfirmText !== workspace.name) return;

        startTransition(async () => {
            try {
                await deleteWorkspace(workspace.slug);
                router.push('/dashboard');
            } catch (error) {
                console.error('Failed to delete workspace:', error);
                alert('Failed to delete workspace');
            }
        });
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
                <p className="text-[var(--text-secondary)]">Configure your workspace preferences</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div id="settings-general" className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <SettingsIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">General</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Workspace Name</label>
                            <input type="text" value={workspace.name} className="input" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Workspace Slug</label>
                            <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                <span className="text-xs text-[var(--text-secondary)]">flux.com/</span>
                                <span className="text-sm font-medium">{workspace.slug}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visibility Settings */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Visibility & Access</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Public Access</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Allow anyone with the link to view this board (read-only)
                            </p>
                        </div>
                        <button
                            onClick={handleTogglePublicAccess}
                            disabled={isPending}
                            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${publicAccess ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-subtle)]'
                                } ${isPending ? 'opacity-50' : ''}`}
                        >
                            <div
                                className={`absolute top-1 bottom-1 w-4 rounded-full bg-white transition-all ${publicAccess ? 'right-1' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card p-6 opacity-60 grayscale cursor-not-allowed">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-[var(--text-secondary)]" />
                        <h2 className="font-semibold text-[var(--text-secondary)]">Security</h2>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Advanced security controls are available on the Pro plan.
                    </p>
                </div>

                {/* Danger Zone */}
                <div id="settings-danger" className="card p-6 border-red-200 bg-red-50/30">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <Trash2 className="w-4 h-4" />
                        <h2 className="font-semibold">Danger Zone</h2>
                    </div>

                    {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Delete Workspace</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    Permanently remove this workspace and all its data.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-red-600">
                                This action cannot be undone. This will permanently delete the workspace{' '}
                                <strong>{workspace.name}</strong> and all associated data.
                            </p>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Type <strong>{workspace.name}</strong> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="input"
                                    placeholder={workspace.name}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteWorkspace}
                                    disabled={deleteConfirmText !== workspace.name || isPending}
                                    className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'I understand, delete this workspace'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
