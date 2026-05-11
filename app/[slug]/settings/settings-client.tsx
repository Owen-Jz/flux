'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Cog6ToothIcon, GlobeAltIcon, ShieldCheckIcon, TrashIcon, ArrowPathIcon, PaintBrushIcon, CheckIcon, ExclamationCircleIcon, XMarkIcon, CreditCardIcon, PhotoIcon, BellIcon, KeyIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { updateWorkspaceSettings } from '@/actions/workspace';
import { deleteWorkspace } from '@/actions/access-control';
import { BillingSection } from '@/components/billing/billing-section';
import { WorkspaceIconPicker } from '@/components/workspace/workspace-icon-picker';
import { NotificationPermissionBanner } from '@/components/pwa/notification-permission-banner';
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from '@/lib/pwa/push-manager';
import { ApiKeysTable } from '@/components/settings/api-keys-table';
import { WebhooksTable } from '@/components/settings/webhooks-table';

interface SettingsClientProps {
    workspace: {
        name: string;
        slug: string;
        publicAccess: boolean;
        accentColor?: string;
        icon?: {
            type: 'upload' | 'emoji';
            url?: string;
            emoji?: string;
        };
    };
}

const BRAND_COLORS = [
    { label: 'Default', value: '#6366f1' }, // Indigo
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Sky', value: '#0ea5e9' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Fuchsia', value: '#d946ef' },
    { label: 'Slate', value: '#475569' },
];

export function SettingsClient({ workspace }: SettingsClientProps) {
    const router = useRouter();
    const [publicAccess, setPublicAccess] = useState(workspace.publicAccess);
    const [accentColor, setAccentColor] = useState(workspace.accentColor || '#6366f1');
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'api-keys' | 'webhooks'>('general');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        isPushSupported().then(result => {
            if (!cancelled) setPushEnabled(result);
        });
        return () => { cancelled = true; };
    }, []);

    const handleTogglePublicAccess = async () => {
        const newValue = !publicAccess;
        setPublicAccess(newValue);
        setError(null);

        startTransition(async () => {
            try {
                await updateWorkspaceSettings(workspace.slug, { publicAccess: newValue });
            } catch (err) {
                setPublicAccess(!newValue); // Revert on error
                setError(err instanceof Error ? err.message : 'Failed to update settings');
            }
        });
    };

    const handleUpdateAccentColor = async (color: string) => {
        setAccentColor(color);
        setError(null);

        startTransition(async () => {
            try {
                await updateWorkspaceSettings(workspace.slug, { accentColor: color });
                router.refresh();
            } catch (err) {
                setAccentColor(workspace.accentColor || '#6366f1');
                setError(err instanceof Error ? err.message : 'Failed to update accent color');
            }
        });
    };

    const handleDeleteWorkspace = async () => {
        if (deleteConfirmText !== workspace.name) return;
        setError(null);

        startTransition(async () => {
            try {
                await deleteWorkspace(workspace.slug);
                router.push('/dashboard');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete workspace');
            }
        });
    };

    const handleTogglePush = async () => {
        const wasEnabled = pushEnabled;
        setPushEnabled(!wasEnabled);
        setPushLoading(true);
        setError(null);
        try {
            if (wasEnabled) {
                await unsubscribeFromPush();
                setPushEnabled(false);
            } else {
                await subscribeToPush(workspace.slug);
                setPushEnabled(true);
            }
        } catch (err) {
            setPushEnabled(wasEnabled); // revert
            setError(err instanceof Error ? err.message : 'Failed to update notification settings');
        } finally {
            setPushLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 pt-12 md:pt-16 max-w-3xl mx-auto overflow-x-hidden">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
                <p className="text-[var(--text-secondary)]">Configure your workspace preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border-subtle)] pb-4">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'general'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <Cog6ToothIcon className="w-4 h-4" />
                    General
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'billing'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <CreditCardIcon className="w-4 h-4" />
                    Billing
                </button>
                <button
                    onClick={() => setActiveTab('api-keys')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'api-keys'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <KeyIcon className="w-4 h-4" />
                    API Keys
                </button>
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'webhooks'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <PuzzlePieceIcon className="w-4 h-4" />
                    Webhooks
                </button>
            </div>

            {activeTab === 'webhooks' ? (
                <WebhooksTable />
            ) : activeTab === 'api-keys' ? (
                <ApiKeysTable />
            ) : activeTab === 'billing' ? (
                <BillingSection />
            ) : (
            <div className="space-y-6">
                {/* General Settings */}
                <div id="settings-general" className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Cog6ToothIcon className="w-4 h-4 text-[var(--brand-primary)]" />
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
                        <GlobeAltIcon className="w-4 h-4 text-[var(--brand-primary)]" />
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

                {/* Notifications */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BellIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Notifications</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Push Notifications</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Receive push notifications for task updates in this workspace.
                            </p>
                        </div>
                        <button
                            onClick={handleTogglePush}
                            disabled={pushLoading}
                            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${pushEnabled ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-subtle)]'
                                } ${pushLoading ? 'opacity-50' : ''}`}
                        >
                            <div
                                className={`absolute top-1 bottom-1 w-4 rounded-full bg-white transition-all ${pushEnabled ? 'right-1' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>
                    <div className="mt-4">
                        <NotificationPermissionBanner workspaceId={workspace.slug} />
                    </div>
                </div>

                {/* Brand Appearance */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PaintBrushIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Appearance</h2>
                    </div>
                    <div className="space-y-6">
                        {/* Workspace Icon */}
                        <div>
                            <p className="text-sm font-medium">Workspace Icon</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">
                                Set a custom icon or emoji to represent your workspace.
                            </p>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowIconPicker(true)}
                                    className="w-16 h-16 rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl hover:border-[var(--brand-primary)] transition-colors overflow-hidden"
                                >
                                    {workspace.icon?.type === 'emoji' ? (
                                        <span>{workspace.icon.emoji}</span>
                                    ) : workspace.icon?.type === 'upload' ? (
                                        <Image src={workspace.icon.url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-6 h-6 text-[var(--text-secondary)]" />
                                    )}
                                </button>
                                <div>
                                    <button
                                        onClick={() => setShowIconPicker(true)}
                                        className="btn btn-secondary text-sm"
                                    >
                                        {workspace.icon ? 'Change icon' : 'Set icon'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Brand Color */}
                        <div>
                            <p className="text-sm font-medium">Brand Color</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                                Choose a primary color for this workspace's dashboard and interface.
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                {BRAND_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleUpdateAccentColor(color.value)}
                                        disabled={isPending}
                                        className={`group relative w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${accentColor === color.value
                                            ? 'border-[var(--brand-primary)] scale-110 shadow-lg'
                                            : 'border-transparent hover:scale-105 hover:border-gray-200'}`}
                                        title={color.label}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-lg shadow-inner"
                                            style={{ backgroundColor: color.value }}
                                        />
                                        {accentColor === color.value && (
                                            <div className="absolute -top-1 -right-1 bg-[var(--brand-primary)] text-white p-0.5 rounded-full ring-2 ring-white">
                                                <CheckIcon className="w-2 h-2" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card p-6 opacity-60 grayscale cursor-not-allowed">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheckIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                        <h2 className="font-semibold text-[var(--text-secondary)]">Security</h2>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Advanced security controls are available on the Pro plan.
                    </p>
                </div>

                {/* Danger Zone */}
                <div id="settings-danger" className="card p-6 border-red-200 bg-red-50/30">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <TrashIcon className="w-4 h-4" />
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
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
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
            )}

            {showIconPicker && (
                <WorkspaceIconPicker
                    workspaceSlug={workspace.slug}
                    currentIcon={workspace.icon}
                    onClose={() => setShowIconPicker(false)}
                    onIconChange={() => router.refresh()}
                />
            )}
        </div>
    );
}
