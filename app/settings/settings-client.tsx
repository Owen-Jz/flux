'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Cog6ToothIcon,
    UserIcon,
    CreditCardIcon,
    BellIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationCircleIcon,
    XMarkIcon,
    KeyIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { BillingSection } from '@/components/billing/billing-section';
import { signOut } from 'next-auth/react';
import { PLAN_META } from '@/lib/plan-limits';

interface UserSettingsClientProps {
    user: {
        id: string;
        name?: string | null;
        email: string;
        image?: string | null;
        plan: string;
        subscriptionStatus: string | null;
        trialEndsAt: string | null;
        hasUsedTrial: boolean;
    };
    billingParam?: string | null;
    actionParam?: string | null;
}

export function UserSettingsClient({ user, billingParam, actionParam }: UserSettingsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications' | 'danger'>(
        billingParam === 'trial' || actionParam === 'activate-trial' ? 'billing' : 'profile'
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const planMeta = PLAN_META[user.plan as keyof typeof PLAN_META] || PLAN_META.free;

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
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-800">{success}</p>
                    <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Account Settings</h1>
                    <p className="text-[var(--text-secondary)]">Manage your account preferences and billing</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors text-[var(--text-secondary)] flex items-center gap-2"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border-subtle)] pb-4">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'profile'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <UserIcon className="w-4 h-4" />
                    Profile
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
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'notifications'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                >
                    <BellIcon className="w-4 h-4" />
                    Notifications
                </button>
                <button
                    onClick={() => setActiveTab('danger')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'danger'
                            ? 'bg-red-600 text-white'
                            : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                    <TrashIcon className="w-4 h-4" />
                    Danger
                </button>
            </div>

            {activeTab === 'danger' ? (
                <div className="space-y-6">
                    <div className="card p-6 border-red-200 bg-red-50/30">
                        <div className="flex items-center gap-2 mb-4 text-red-600">
                            <TrashIcon className="w-4 h-4" />
                            <h2 className="font-semibold">Delete Account</h2>
                        </div>

                        {!showDeleteConfirm ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Permanently delete your account</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        This will permanently delete your account and all associated data. This action cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                    Delete Account
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-red-600">
                                    <strong>Warning:</strong> This action cannot be undone. All your workspaces, boards, tasks, and data will be permanently deleted.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Type <strong>delete</strong> to confirm:
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] focus:outline-none focus:border-red-500"
                                        placeholder="delete"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (deleteConfirmText === 'delete') {
                                                // TODO: Implement account deletion
                                                setError('Account deletion is not yet implemented');
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }
                                        }}
                                        disabled={deleteConfirmText !== 'delete' || isPending}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isPending ? (
                                            <>
                                                <ArrowPathIcon className="w-4 h-4 inline animate-spin mr-1" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete Account'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteConfirmText('');
                                        }}
                                        className="px-4 py-2 bg-[var(--surface)] text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors border border-[var(--border-subtle)]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'billing' ? (
                <BillingSection />
            ) : activeTab === 'notifications' ? (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BellIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                            <h2 className="font-semibold">Email Notifications</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
                                <div>
                                    <p className="text-sm font-medium">Task Assignments</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Get notified when a task is assigned to you</p>
                                </div>
                                <button className="w-12 h-6 rounded-full relative bg-[var(--brand-primary)] transition-colors cursor-pointer">
                                    <div className="absolute top-1 bottom-1 right-1 w-4 rounded-full bg-white" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
                                <div>
                                    <p className="text-sm font-medium">Workspace Updates</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Get notified about workspace changes</p>
                                </div>
                                <button className="w-12 h-6 rounded-full relative bg-[var(--brand-primary)] transition-colors cursor-pointer">
                                    <div className="absolute top-1 bottom-1 right-1 w-4 rounded-full bg-white" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium">Billing Alerts</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Get notified about payment and subscription events</p>
                                </div>
                                <button className="w-12 h-6 rounded-full relative bg-[var(--brand-primary)] transition-colors cursor-pointer">
                                    <div className="absolute top-1 bottom-1 right-1 w-4 rounded-full bg-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
            <div className="space-y-6">
                {/* Profile Settings */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Cog6ToothIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Profile Information</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name || 'User'}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white text-xl font-bold">
                                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <button className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors">
                                    Change Avatar
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input
                                type="text"
                                defaultValue={user.name || ''}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] focus:outline-none focus:border-[var(--brand-primary)]"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                readOnly
                                className="w-full px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-secondary)] cursor-not-allowed"
                            />
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">Email cannot be changed</p>
                        </div>

                        {/* Update Button */}
                        <div className="pt-2">
                            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Current Plan */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheckIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Current Plan</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold">{planMeta.label} Plan</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {user.subscriptionStatus === 'active' ? 'Active subscription' :
                                 user.subscriptionStatus === 'trialing' ? 'Free trial' :
                                 user.subscriptionStatus === 'past_due' ? 'Payment overdue' :
                                 user.subscriptionStatus === 'cancelled' ? 'Cancelled' : 'Free tier'}
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors"
                        >
                            Manage Billing
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <KeyIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                        <h2 className="font-semibold">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Password</p>
                                <p className="text-xs text-[var(--text-secondary)]">Last changed: Never</p>
                            </div>
                            <button className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors">
                                Change Password
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                            <div>
                                <p className="text-sm font-medium">Google OAuth</p>
                                <p className="text-xs text-[var(--text-secondary)]">Linked to your account</p>
                            </div>
                            <button className="px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors text-red-600">
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}