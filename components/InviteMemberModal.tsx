'use client';

import { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await inviteMemberToWorkspace(slug, email, role);
            if (res?.error) {
                toast.error(res.error);
                return;
            }
            // Track onboarding progress for first member invite
            await updateOnboardingProgress('addedFirstTeamMember');
            toast.success(res?.message || 'Invitation sent successfully!');
            setTimeout(onClose, 1500);
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong');
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

                <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all placeholder:text-[var(--text-tertiary)]"
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
            </div>
        </div>
    );
}
