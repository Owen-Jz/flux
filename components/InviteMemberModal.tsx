'use client';

import { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, ArrowPathIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { inviteMemberToWorkspace } from '@/actions/workspace-invite';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface InviteMemberModalProps {
    slug: string;
    onClose: () => void;
}

export default function InviteMemberModal({ slug, onClose }: InviteMemberModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'VIEWER' | 'EDITOR' | 'ADMIN'>('VIEWER');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await inviteMemberToWorkspace(slug, email, role);
            if (res?.error) {
                setError(res.error);
                return;
            }
            // Track onboarding progress for first member invite
            await updateOnboardingProgress('addedFirstTeamMember');
            setSuccess(true);
            setSuccessMessage(res?.message || 'Invitation sent successfully!');
            setTimeout(onClose, 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2 text-[var(--foreground)]">Invite Team Member</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Enter the email address of the person you'd like to invite. If they don't have an account, they'll receive an email to sign up and join this workspace.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 text-green-500 p-4 rounded-lg flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <UserPlusIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-medium text-green-800 dark:text-green-100">Invitation Sent!</p>
                            <p className="text-xs opacity-80 text-green-700 dark:text-green-200">{successMessage}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all placeholder-[var(--text-secondary)]/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR' | 'ADMIN')}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all"
                            >
                                <option value="VIEWER">Viewer - Can view boards and tasks</option>
                                <option value="EDITOR">Editor - Can create and edit tasks</option>
                                <option value="ADMIN">Admin - Full access including settings</option>
                            </select>
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
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-[var(--brand-primary)]/20"
                            >
                                {isLoading ? (
                                    <>
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <EnvelopeIcon className="w-4 h-4" />
                                        Send Invite
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
