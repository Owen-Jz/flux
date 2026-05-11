'use client';

import { useState, useEffect } from 'react';
import { KeyIcon, PlusIcon, TrashIcon, EyeIcon, XMarkIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
}

export function ApiKeysTable() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKey, setNewKey] = useState<{ name: string; key: string; expiresAt: string | null } | null>(null);
    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');

    useEffect(() => {
        fetchKeys();
        fetchUserPlan();
    }, []);

    async function fetchUserPlan() {
        try {
            const res = await fetch('/api/v1/api-keys?plan-check=1');
            if (res.ok) {
                const data = await res.json();
                setUserPlan(data.plan || 'free');
            }
        } catch {}
    }

    async function fetchKeys() {
        try {
            const res = await fetch('/api/v1/api-keys');
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys || []);
            }
        } catch (err) {
            setError('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    }

    async function createKey(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const expiresAt = (form.elements.namedItem('expiresAt') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/v1/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, expiresAt: expiresAt || undefined }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to create API key');
                return;
            }
            setNewKey({ name, key: data.key, expiresAt: data.expiresAt });
            setShowCreateModal(false);
            fetchKeys();
        } catch {
            setError('Failed to create API key');
        }
    }

    async function revokeKey(keyId: string) {
        try {
            const res = await fetch(`/api/v1/api-keys/${keyId}`, { method: 'DELETE' });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== keyId));
            }
        } catch {
            setError('Failed to revoke API key');
        }
        setRevokeId(null);
    }

    const isPro = userPlan === 'pro' || userPlan === 'enterprise';

    if (!isPro) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center">
                        <LockClosedIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div>
                        <h2 className="font-semibold">API Keys</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Available on Pro plan and above</p>
                    </div>
                </div>
                <div className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Upgrade to Pro to create API keys and integrate Flux with your favorite tools and AI agents.
                    </p>
                    <a href="/pricing" className="btn btn-primary mt-4 inline-flex items-center gap-2">
                        Upgrade to Pro
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
                        <KeyIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                    </div>
                    <div>
                        <h2 className="font-semibold">API Keys</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Manage API keys for external integrations</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    Create Key
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
            ) : keys.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                    <KeyIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No API keys yet</p>
                    <p className="text-sm mt-1">Create your first key to start integrating</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                            <div>
                                <p className="font-medium text-sm">{key.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                                    flx_{key.keyPrefix}...
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                                    <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                    {key.lastUsedAt && <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                                    {key.expiresAt && <span>Expires {new Date(key.expiresAt).toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => setRevokeId(key.id)}
                                className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Revoke key"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Create API Key</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={createKey} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input name="name" type="text" required placeholder="Claude Desktop" className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Expires (optional)</label>
                                <input name="expiresAt" type="date" className="input w-full" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Create Key</button>
                        </form>
                    </div>
                </div>
            )}

            {/* New Key Display Modal */}
            {newKey && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNewKey(null)}>
                    <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">API Key Created</h3>
                            <button onClick={() => setNewKey(null)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                            Copy this key now — it will not be shown again.
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg p-3 font-mono text-sm break-all mb-4">
                            {newKey.key}
                        </div>
                        <button onClick={() => setNewKey(null)} className="btn btn-primary w-full">Done</button>
                    </div>
                </div>
            )}

            {/* Revoke Confirm Modal */}
            {revokeId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRevokeId(null)}>
                    <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold mb-2">Revoke API Key?</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">This action cannot be undone. Any applications using this key will lose access immediately.</p>
                        <div className="flex gap-2">
                            <button onClick={() => revokeKey(revokeId)} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Revoke</button>
                            <button onClick={() => setRevokeId(null)} className="btn btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}