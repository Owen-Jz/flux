'use client';

import { useState, useTransition } from 'react';
import { updateMemberRole, removeMember } from '@/actions/workspace';
import { Check, X, Loader2, Trash2 } from 'lucide-react';

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
}

export function MemberRow({ member, slug, isAdmin }: MemberRowProps) {
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
            } catch (error) {
                console.error('Failed to update role:', error);
                alert('Failed to update role');
            }
        });
    };

    const handleRemove = () => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        startTransition(async () => {
            try {
                await removeMember(slug, member.userId);
            } catch (error) {
                console.error('Failed to remove member:', error);
                alert('Failed to remove member');
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
                        className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    >
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                    </select>
                ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : member.role === 'EDITOR'
                            ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            : 'bg-gray-100 text-gray-600'
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
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    title="Save"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    disabled={isPending}
                                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                <button
                                    onClick={handleRemove}
                                    disabled={isPending}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    title="Remove Member"
                                >
                                    <Trash2 className="w-4 h-4" />
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
                        <span className="text-xs text-gray-400 italic">Admin</span>
                    )}
                </td>
            )}
        </tr>
    );
}
