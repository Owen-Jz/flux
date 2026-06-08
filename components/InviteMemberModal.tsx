'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, EnvelopeIcon, ArrowPathIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { inviteMemberToWorkspace } from '@/actions/workspace-invite';
import { updateOnboardingProgress } from '@/actions/onboarding';
import CustomSelect from './ui/custom-select';

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
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isLoading && onClose()}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="invite-modal-title"
                className="relative max-h-[90vh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-2xl md:max-w-md md:p-6"
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="mb-6 flex items-start gap-3 pr-8">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                        <UserPlusIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 id="invite-modal-title" className="text-lg font-bold text-[var(--foreground)]">
                            Invite a team member
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                            They&apos;ll get an email to join this workspace. New users can sign up first.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Email address
                        </label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="input text-base md:text-sm"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label id="invite-role-label" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Role
                        </label>
                        <CustomSelect
                            value={role}
                            onChange={(v) => setRole(v as 'VIEWER' | 'EDITOR' | 'ADMIN')}
                            options={[
                                { value: 'VIEWER', label: 'Viewer — Can view boards and tasks' },
                                { value: 'EDITOR', label: 'Editor — Can create and edit tasks' },
                                { value: 'ADMIN', label: 'Admin — Full access including settings' },
                            ]}
                            className="w-full"
                            minWidth="100%"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary w-full md:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full md:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <EnvelopeIcon className="h-4 w-4" />
                                    Send invite
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
