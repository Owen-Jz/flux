'use client';

import { useState, useTransition } from 'react';
import { updateMemberRole, removeMember } from '@/actions/workspace';
import { CheckIcon, XMarkIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

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

    return (
        <tr className="hover:bg-[var(--surface)] transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {member.user?.image ? (
                        <img src={member.user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium">
                            {member.user?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium">{member.user?.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{member.user?.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                {isEditing ? (
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as 'EDITOR' | 'VIEWER')}
                        disabled={isPending}
                        className="text-xs border rounded px-2 py-1 bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    >
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                    </select>
                ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : member.role === 'EDITOR'
                            ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            : 'bg-[var(--background-subtle)] text-[var(--text-secondary)]'
                        }`}>
                        {member.role}
                    </span>
                )}
            </td>
            {isAdmin && (
                <td className="px-6 py-4 text-right">
                    {!isMemberAdmin ? (
                        isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="p-2 text-[var(--success-primary)] hover:bg-[var(--success-bg)] rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--success-primary)]"
                                    title="Save"
                                >
                                    {isPending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    disabled={isPending}
                                    className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--background-subtle)] rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                                    title="Cancel"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />
                                <button
                                    onClick={handleRemove}
                                    disabled={isPending}
                                    className="p-2 text-[var(--error-primary)] hover:bg-[var(--error-bg)] rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--error-primary)]"
                                    title="Remove Member"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[var(--text-secondary)] hover:text-[var(--foreground)] text-sm font-medium"
                            >
                                Edit
                            </button>
                        )
                    ) : (
                        <span className="text-xs text-[var(--text-tertiary)] italic">Admin</span>
                    )}
                </td>
            )}
        </tr>
    );
}
