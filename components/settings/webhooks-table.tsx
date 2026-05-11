'use client';

import { useState, useEffect } from 'react';
import { PuzzlePieceIcon, PlusIcon, TrashIcon, XMarkIcon, LockClosedIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    workspaceFilter: string | null;
    active: boolean;
    createdAt: string;
}

const ALL_EVENTS = [
    'task.created',
    'task.updated',
    'task.moved',
    'task.deleted',
    'board.created',
    'board.deleted',
    'workspace.member_added',
    'workspace.member_removed',
    'workspace.settings_changed',
    'task.decomposed',
];

const EVENT_LABELS: Record<string, string> = {
    'task.created': 'Task Created',
    'task.updated': 'Task Updated',
    'task.moved': 'Task Moved',
    'task.deleted': 'Task Deleted',
    'board.created': 'Board Created',
    'board.deleted': 'Board Deleted',
    'workspace.member_added': 'Member Added',
    'workspace.member_removed': 'Member Removed',
    'workspace.settings_changed': 'Settings Changed',
    'task.decomposed': 'Task Decomposed',
};

export function WebhooksTable() {
    const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [testId, setTestId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; statusCode: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');

    useEffect(() => {
        fetchWebhooks();
        fetchUserPlan();
    }, []);

    async function fetchUserPlan() {
        try {
            const res = await fetch('/api/v1/webhooks?plan-check=1');
            if (res.ok) {
                const data = await res.json();
                setUserPlan(data.plan || 'free');
            }
        } catch {}
    }

    async function fetchWebhooks() {
        try {
            const res = await fetch('/api/v1/webhooks');
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data.webhooks || []);
            }
        } catch {
            setError('Failed to load webhooks');
        } finally {
            setLoading(false);
        }
    }

    async function createWebhook(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const url = (form.elements.namedItem('url') as HTMLInputElement).value;
        const events = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="events"]:checked')).map(i => i.value);

        if (events.length === 0) {
            setError('Select at least one event');
            return;
        }

        try {
            const res = await fetch('/api/v1/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, events }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to create webhook');
                return;
            }
            setShowCreateModal(false);
            fetchWebhooks();
        } catch {
            setError('Failed to create webhook');
        }
    }

    async function deleteWebhook(webhookId: string) {
        try {
            const res = await fetch(`/api/v1/webhooks/${webhookId}`, { method: 'DELETE' });
            if (res.ok) {
                setWebhooks(webhooks.filter(w => w.id !== webhookId));
            }
        } catch {
            setError('Failed to delete webhook');
        }
        setDeleteId(null);
    }

    async function toggleWebhook(webhookId: string, active: boolean) {
        try {
            const res = await fetch(`/api/v1/webhooks/${webhookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active }),
            });
            if (res.ok) {
                setWebhooks(webhooks.map(w => w.id === webhookId ? { ...w, active } : w));
            }
        } catch {
            setError('Failed to update webhook');
        }
    }

    async function testWebhook(webhookId: string) {
        setTestId(webhookId);
        setTestResult(null);
        try {
            const res = await fetch(`/api/v1/webhooks/${webhookId}`, { method: 'POST' });
            const data = await res.json();
            setTestResult({ success: data.success, statusCode: data.statusCode });
        } catch {
            setTestResult({ success: false, statusCode: 0 });
        }
        setTestId(null);
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
                        <h2 className="font-semibold">Webhooks</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Available on Pro plan and above</p>
                    </div>
                </div>
                <div className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Upgrade to Pro to receive real-time event notifications in your applications.
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
                        <PuzzlePieceIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Webhooks</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Get notified when events occur in your workspaces</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add Endpoint
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
            )}

            {testResult && (
                <div className={`rounded-lg p-3 mb-4 text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {testResult.success ? (
                        <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Delivery successful (HTTP {testResult.statusCode})</span>
                    ) : (
                        <span className="flex items-center gap-2"><XCircleIcon className="w-4 h-4" /> Delivery failed (HTTP {testResult.statusCode || 'connection error'})</span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
            ) : webhooks.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                    <PuzzlePieceIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No webhook endpoints yet</p>
                    <p className="text-sm mt-1">Add an endpoint to receive event notifications</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{webhook.url}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {webhook.events.map((event) => (
                                            <span key={event} className="text-xs px-2 py-0.5 bg-[var(--background)] rounded-full border border-[var(--border-subtle)]">
                                                {EVENT_LABELS[event] || event}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                                        Created {new Date(webhook.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => testWebhook(webhook.id)}
                                        disabled={testId === webhook.id}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--background)] transition-colors disabled:opacity-50"
                                    >
                                        {testId === webhook.id ? 'Testing...' : 'Test'}
                                    </button>
                                    <button
                                        onClick={() => toggleWebhook(webhook.id, !webhook.active)}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${webhook.active ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--background)]'}`}
                                    >
                                        {webhook.active ? 'Active' : 'Inactive'}
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(webhook.id)}
                                        className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete endpoint"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Add Webhook Endpoint</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={createWebhook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                                <input name="url" type="url" required placeholder="https://your-app.com/webhook" className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Events</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALL_EVENTS.map((event) => (
                                        <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input name="events" type="checkbox" value={event} className="rounded border-[var(--border-subtle)]" />
                                            {EVENT_LABELS[event] || event}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Create Endpoint</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
                    <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold mb-2">Delete Webhook Endpoint?</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">This action cannot be undone.</p>
                        <div className="flex gap-2">
                            <button onClick={() => deleteWebhook(deleteId)} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Delete</button>
                            <button onClick={() => setDeleteId(null)} className="btn btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}