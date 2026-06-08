'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Cog6ToothIcon, GlobeAltIcon, ShieldCheckIcon, TrashIcon, ArrowPathIcon, PaintBrushIcon, CheckIcon, ExclamationCircleIcon, XMarkIcon, CreditCardIcon, PhotoIcon, BellIcon, KeyIcon, PuzzlePieceIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { updateWorkspaceSettings } from '@/actions/workspace';
import { deleteWorkspace } from '@/actions/access-control';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { BillingSection } from '@/components/billing/billing-section';
import { WorkspaceIconPicker } from '@/components/workspace/workspace-icon-picker';
import { NotificationPermissionBanner } from '@/components/pwa/notification-permission-banner';
import { subscribeToPush, unsubscribeFromPush, isPushSupported, requiresPWAInstallForPush } from '@/lib/pwa/push-manager';
import { ApiKeysTable } from '@/components/settings/api-keys-table';
import { WebhooksTable } from '@/components/settings/webhooks-table';
import { hexToRgb, darkenHex } from '@/lib/color';

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
    const searchParams = useSearchParams();
    const [publicAccess, setPublicAccess] = useState(workspace.publicAccess);
    const [accentColor, setAccentColor] = useState(workspace.accentColor || '#6366f1');
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const isBillingCallback = searchParams.get('billing') === 'success' || searchParams.get('billing') === 'trial' || !!searchParams.get('trxref') || !!searchParams.get('reference');
    const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'api-keys' | 'webhooks'>(isBillingCallback ? 'billing' : 'general');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [userPlan, setUserPlan] = useState<string>('free');
    const [name, setName] = useState(workspace.name);
    const [isSavingName, setIsSavingName] = useState(false);
    const [slugCopied, setSlugCopied] = useState(false);

    const trimmedName = name.trim();
    const nameDirty = trimmedName.length > 0 && trimmedName !== workspace.name;

    useEffect(() => {
        let cancelled = false;
        isPushSupported().then(result => {
            if (!cancelled) setPushEnabled(result);
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        async function fetchUserPlan() {
            try {
                const res = await fetch('/api/v1/api-keys?plan-check=1');
                if (res.ok) {
                    const data = await res.json();
                    setUserPlan(data.plan || 'free');
                }
            } catch {}
        }
        fetchUserPlan();
    }, []);

    const isPro = userPlan === 'pro' || userPlan === 'enterprise';

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

    const handleSaveName = async () => {
        if (!nameDirty || isSavingName) return;
        setIsSavingName(true);
        setError(null);
        try {
            await updateWorkspaceSettings(workspace.slug, { name: trimmedName });
            router.refresh();
        } catch (err) {
            setName(workspace.name); // Revert on error
            setError(err instanceof Error ? err.message : 'Failed to rename workspace');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleCopySlug = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${workspace.slug}`);
            setSlugCopied(true);
            setTimeout(() => setSlugCopied(false), 2000);
        } catch {
            // Clipboard API unavailable (e.g. insecure context) — silently ignore.
        }
    };

    /**
     * Writes the brand-accent CSS variables onto the workspace shell element so
     * the whole workspace recolors instantly. Returns the shell element (or null
     * if it isn't mounted, e.g. during SSR) so callers can no-op safely.
     */
    const applyAccentToShell = (color: string): HTMLElement | null => {
        if (typeof document === 'undefined') return null;
        const shell = document.getElementById('workspace-shell');
        if (!shell) return null;
        shell.style.setProperty('--brand-primary', color);
        shell.style.setProperty('--brand-primary-rgb', hexToRgb(color));
        shell.style.setProperty('--brand-primary-hover', darkenHex(color));
        return shell;
    };

    const handleUpdateAccentColor = async (color: string) => {
        const previousColor = accentColor;

        // Optimistic: update local state AND recolor the live platform immediately.
        setAccentColor(color);
        applyAccentToShell(color);
        setError(null);

        startTransition(async () => {
            try {
                await updateWorkspaceSettings(workspace.slug, { accentColor: color });
                router.refresh();
            } catch (err) {
                // Revert both the picker state and the live CSS variables.
                setAccentColor(previousColor);
                applyAccentToShell(previousColor);
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
                if (requiresPWAInstallForPush()) {
                    setPushEnabled(false);
                    setError('On iPhone/iPad, install Flux to the Home Screen first (Share → Add to Home Screen) to enable notifications.');
                    return;
                }
                const result = await subscribeToPush(workspace.slug);
                if (result.ok) {
                    setPushEnabled(true);
                } else {
                    setPushEnabled(false);
                    if (result.reason === 'permission-denied') {
                        setError('Notification permission was denied. Enable it in your browser settings.');
                    } else if (result.reason === 'unsupported') {
                        setError('This browser does not support push notifications.');
                    } else {
                        setError('Could not enable notifications. Please try again.');
                    }
                }
            }
        } catch (err) {
            setPushEnabled(wasEnabled); // revert
            setError(err instanceof Error ? err.message : 'Failed to update notification settings');
        } finally {
            setPushLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {error && (
                <div
                    role="alert"
                    className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--flux-error-border)] bg-[var(--flux-error-bg)] p-4"
                >
                    <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-[var(--flux-error-primary)]" />
                    <p className="text-sm font-medium text-[var(--flux-error-text-strong)]">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        className="ml-auto text-[var(--flux-error-primary)] transition-opacity hover:opacity-70"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
            <DashboardHeader
                eyebrow="Workspace"
                title="Settings"
                subtitle={`Configure ${workspace.name}`}
            />

            {/* Tab Navigation */}
            <div className="overflow-x-auto -mx-4 px-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                        className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'billing'
                                ? 'bg-[var(--brand-primary)] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                        }`}
                    >
                        <CreditCardIcon className="w-4 h-4" />
                        Billing
                    </button>
                    {isPro && (
                        <>
                            <button
                                onClick={() => setActiveTab('api-keys')}
                                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'webhooks'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                                }`}
                            >
                                <PuzzlePieceIcon className="w-4 h-4" />
                                Webhooks
                            </button>
                        </>
                    )}
                </div>
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
                            <label htmlFor="workspace-name" className="mb-1 block text-sm font-medium">
                                Workspace Name
                            </label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    id="workspace-name"
                                    type="text"
                                    value={name}
                                    maxLength={60}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                    }}
                                    className="input"
                                    placeholder="e.g. Acme Inc."
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveName}
                                    disabled={!nameDirty || isSavingName}
                                    className="btn btn-primary flex-shrink-0 disabled:opacity-50"
                                >
                                    {isSavingName ? (
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
                        <div>
                            <label className="mb-1 block text-sm font-medium">Workspace URL</label>
                            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] p-2 pl-3">
                                <span className="truncate text-sm text-[var(--text-secondary)]">
                                    flux.com/<span className="font-medium text-[var(--text-primary)]">{workspace.slug}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopySlug}
                                    aria-label="Copy workspace URL"
                                    className="ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                                >
                                    {slugCopied ? (
                                        <>
                                            <CheckIcon className="h-3.5 w-3.5 text-[var(--flux-success-primary)]" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                                The URL stays fixed even if you rename the workspace, so existing links keep working.
                            </p>
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
                                Allow anyone with the link to view this workspace (read-only)
                            </p>
                        </div>
                        <button
                            onClick={handleTogglePublicAccess}
                            disabled={isPending}
                            aria-label="Toggle public access"
                            className={`w-14 h-7 md:w-12 md:h-6 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${publicAccess ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-subtle)]'
                                } ${isPending ? 'opacity-50' : ''}`}
                        >
                            <div
                                className={`absolute top-1 bottom-1 w-5 md:w-4 rounded-full bg-white transition-all ${publicAccess ? 'right-1' : 'left-1'
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
                                        <Image src={workspace.icon.url || ''} alt="" width={64} height={64} className="w-full h-full object-cover" />
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
                                Choose a primary color for this workspace&apos;s dashboard and interface.
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 md:gap-3">
                                {BRAND_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleUpdateAccentColor(color.value)}
                                        disabled={isPending}
                                        className={`group relative w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${accentColor === color.value
                                            ? 'border-[var(--brand-primary)] scale-110 shadow-lg'
                                            : 'border-transparent hover:scale-105 hover:border-[var(--border-default)]'}`}
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

                {/* Delete workspace */}
                <div id="settings-danger" className="card p-6 border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
                        <TrashIcon className="w-4 h-4" />
                        <h2 className="font-semibold text-[var(--foreground)]">Delete Workspace</h2>
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
                                className="btn btn-secondary flex-shrink-0 text-[var(--flux-error-primary)] hover:border-[var(--flux-error-border)] hover:bg-[var(--flux-error-bg)]"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--flux-error-text-strong)]">
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
                                    className="btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
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
