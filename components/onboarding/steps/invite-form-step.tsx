'use client';

import { useState } from 'react';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { inviteMemberToWorkspace } from '@/actions/workspace-invite';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface InviteFormStepProps {
    workspaceSlug: string;
    onComplete: () => void;
    onSkip: () => void;
}

export function InviteFormStep({ workspaceSlug, onComplete, onSkip }: InviteFormStepProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('EDITOR');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await inviteMemberToWorkspace(workspaceSlug, email, role);

            if (res?.error) {
                setError(res.error);
                toast.error(res.error);
                return;
            }

            // Track onboarding progress
            await updateOnboardingProgress('addedFirstTeamMember');

            toast.success(res?.message || 'Invitation sent successfully!');
            onComplete();
        } catch (err: any) {
            const message = err.message || 'Something went wrong';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[var(--brand-primary)]">
                    <UsersIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Invite a Team Member</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Collaborate with your team by inviting them to your workspace.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full px-3 py-2.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)] text-sm"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setRole('EDITOR')}
                            className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                                role === 'EDITOR'
                                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                    : 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                            }`}
                        >
                            Editor
                            <span className="block text-xs opacity-70 mt-0.5 font-normal">Can create and edit tasks</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('VIEWER')}
                            className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                                role === 'VIEWER'
                                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                    : 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                            }`}
                        >
                            Viewer
                            <span className="block text-xs opacity-70 mt-0.5 font-normal">Can view only</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--background-subtle)]"
                    >
                        Skip
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
    );
}