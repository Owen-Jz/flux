'use client';

import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { inviteMemberToWorkspace } from '@/actions/workspace-invite';

interface InviteMemberModalProps {
    slug: string;
    onClose: () => void;
}

export default function InviteMemberModal({ slug, onClose }: InviteMemberModalProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            await inviteMemberToWorkspace(slug, email);
            setSuccess(true);
            setTimeout(onClose, 2000);
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
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2 text-[var(--foreground)]">Invite Team Member</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Enter the email address of the person you'd like to invite to this workspace.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 text-green-500 p-4 rounded-lg flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Invitation Sent!</p>
                            <p className="text-xs opacity-80 text-blue-800 dark:text-blue-200">User added to workspace.</p>
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
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
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
