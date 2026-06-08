'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { updateMemberRole, removeMember } from '@/actions/workspace';
import { CheckIcon, XMarkIcon, ArrowPathIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import CustomSelect from '@/components/ui/custom-select';
import { RoleBadge } from './RoleBadge';

interface Member {
    userId: string;
    role: string;
    user: {
        name: string;
        email: string;
        image?: string;
    } | null;
}

interface MemberRowProps {
    member: Member;
    slug: string;
    isAdmin: boolean;
    onError?: (error: string) => void;
}

export function MemberRow({ member, slug, isAdmin, onError }: MemberRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>(
        (member.role === 'EDITOR' || member.role === 'VIEWER') ? member.role : 'VIEWER'
    );
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateMemberRole(slug, member.userId, selectedRole);
                setIsEditing(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
                if (onError) {
                    onError(errorMessage);
                }
            }
        });
    };

    const handleRemove = () => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        startTransition(async () => {
            try {
                await removeMember(slug, member.userId);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
                if (onError) {
                    onError(errorMessage);
                }
            }
        });
    };

    const isMemberAdmin = member.role === 'ADMIN';
    const displayName = member.user?.name || member.user?.email || 'Unknown user';
    const initial = (member.user?.name || member.user?.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="group flex items-center gap-3 px-4 md:px-5 py-3.5 transition-colors hover:bg-[var(--background-subtle)]">
            {/* Identity */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
                {member.user?.image ? (
                    <Image
                        src={member.user.image}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-[var(--border-subtle)]"
                    />
                ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-sm font-semibold text-[var(--brand-primary)] ring-1 ring-[var(--border-subtle)]">
                        {initial}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
                    {member.user?.email && (
                        <p className="truncate text-xs text-[var(--text-secondary)]">{member.user.email}</p>
                    )}
                </div>
            </div>

            {/* Role */}
            <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:gap-3">
                {isEditing ? (
                    <CustomSelect
                        value={selectedRole}
                        onChange={(v) => setSelectedRole(v as 'EDITOR' | 'VIEWER')}
                        options={[
                            { value: 'EDITOR', label: 'Editor' },
                            { value: 'VIEWER', label: 'Viewer' },
                        ]}
                        minWidth="110px"
                    />
                ) : (
                    <RoleBadge role={member.role} />
                )}

                {/* Actions */}
                {isAdmin && (
                    <div className="flex min-w-[68px] items-center justify-end">
                        {!isMemberAdmin ? (
                            isEditing ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSave}
                                        disabled={isPending}
                                        aria-label="Save role change"
                                        className="rounded-lg p-2 transition-colors hover:bg-[var(--background-subtle)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                                        style={{ color: 'var(--flux-success-primary)' }}
                                        title="Save"
                                    >
                                        {isPending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        disabled={isPending}
                                        aria-label="Cancel edit"
                                        className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background-subtle)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                                        title="Cancel"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 opacity-100 transition-opacity duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        aria-label={`Edit role for ${displayName}`}
                                        className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                                        title="Edit role"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={handleRemove}
                                        disabled={isPending}
                                        aria-label={`Remove ${displayName}`}
                                        className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--background-subtle)] disabled:opacity-50 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] hover:[color:var(--flux-error-primary)]"
                                        title="Remove member"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )
                        ) : (
                            <span className="text-xs font-medium text-[var(--text-tertiary)]">Owner</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
