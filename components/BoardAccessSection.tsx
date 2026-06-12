'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, LockClosedIcon, GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getBoardAccess, updateBoardAccess } from '@/actions/board';
import { getWorkspaceMembers } from '@/actions/task';
import { toast } from 'sonner';

type Visibility = 'WORKSPACE' | 'RESTRICTED';

interface WorkspaceMember {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

interface BoardAccessSectionProps {
    workspaceSlug: string;
    boardSlug: string;
    /**
     * Pre-loaded workspace roster. When supplied (e.g. the board page already
     * has it in props), the component skips the `getWorkspaceMembers` round-trip
     * entirely — only the board's access state is fetched, so the section loads
     * near-instantly. Omit it (e.g. the sidebar board list) and the roster is
     * fetched on mount instead.
     */
    members?: WorkspaceMember[];
    /** Current user's id — excluded from the picker since admins always have access. */
    currentUserId?: string;
}

/**
 * Admin-only board access controls. Lets an admin switch a board between
 * "all workspace members" and "only specific members", and pick who those
 * members are. Self-contained: loads its own data and saves independently of
 * the surrounding board-details form.
 */
export default function BoardAccessSection({ workspaceSlug, boardSlug, members: membersProp, currentUserId }: BoardAccessSectionProps) {
    const [visibility, setVisibility] = useState<Visibility>('WORKSPACE');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [members, setMembers] = useState<WorkspaceMember[]>(membersProp ?? []);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                // Always need the board's current access state; only fetch the
                // roster when the parent didn't hand us one.
                const [access, roster] = await Promise.all([
                    getBoardAccess(workspaceSlug, boardSlug),
                    membersProp ? Promise.resolve(membersProp) : getWorkspaceMembers(workspaceSlug),
                ]);
                if (cancelled) return;
                setVisibility(access.visibility);
                setSelectedIds(new Set(access.memberIds));
                setMembers(roster);
            } catch (err: unknown) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Failed to load board access');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [workspaceSlug, boardSlug, membersProp]);

    // The current admin always has access, so listing them in the picker is
    // noise — drop them from the selectable roster.
    const selectableMembers = currentUserId
        ? members.filter((m) => m.id !== currentUserId)
        : members;

    const toggleMember = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await updateBoardAccess(workspaceSlug, boardSlug, {
                visibility,
                memberIds: visibility === 'RESTRICTED' ? Array.from(selectedIds) : [],
            });
            toast.success('Board access updated');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update board access';
            setError(message);
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pt-8 border-t border-[var(--border-subtle)]">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 ml-1">Board Access</label>
            <p className="text-xs text-[var(--text-tertiary)] mb-4 ml-1">
                Control who can see this board. Workspace admins always have access.
            </p>

            {isLoading ? (
                <div className="py-8 text-center bg-[var(--background-subtle)] border border-dashed border-[var(--border-subtle)] rounded-2xl">
                    <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-tertiary)] mt-2">Loading access…</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Visibility options */}
                    <button
                        type="button"
                        onClick={() => setVisibility('WORKSPACE')}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                            visibility === 'WORKSPACE'
                                ? 'border-[var(--brand-primary)] bg-[var(--flux-info-bg)]'
                                : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                        }`}
                    >
                        <GlobeAltIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-[var(--text-secondary)]" />
                        <div className="flex-1">
                            <span className="block text-sm font-medium text-[var(--text-primary)]">All workspace members</span>
                            <span className="block text-xs text-[var(--text-tertiary)]">Everyone in the workspace can see this board.</span>
                        </div>
                        {visibility === 'WORKSPACE' && <CheckIcon className="w-5 h-5 text-[var(--brand-primary)]" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setVisibility('RESTRICTED')}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                            visibility === 'RESTRICTED'
                                ? 'border-[var(--brand-primary)] bg-[var(--flux-info-bg)]'
                                : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                        }`}
                    >
                        <LockClosedIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-[var(--text-secondary)]" />
                        <div className="flex-1">
                            <span className="block text-sm font-medium text-[var(--text-primary)]">Only specific members</span>
                            <span className="block text-xs text-[var(--text-tertiary)]">Pick who can see this board. Others won&apos;t see it at all.</span>
                        </div>
                        {visibility === 'RESTRICTED' && <CheckIcon className="w-5 h-5 text-[var(--brand-primary)]" />}
                    </button>

                    {/* Member checklist (only when restricted) */}
                    {visibility === 'RESTRICTED' && (
                        <div className="bg-[var(--background-subtle)] border border-[var(--border-subtle)] p-3 rounded-2xl space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                            {selectableMembers.length === 0 ? (
                                <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No other members to add yet.</p>
                            ) : (
                                selectableMembers.map((m) => {
                                    const checked = selectedIds.has(m.id);
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => toggleMember(m.id)}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)] transition-colors text-left"
                                        >
                                            <span
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    checked
                                                        ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]'
                                                        : 'border-[var(--border-default)]'
                                                }`}
                                            >
                                                {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{m.name || m.email}</span>
                                                {m.name && <span className="block text-xs text-[var(--text-tertiary)] truncate">{m.email}</span>}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="text-xs font-bold text-[var(--flux-error-primary)] bg-[var(--flux-error-bg)] px-4 py-3 rounded-xl border border-[var(--flux-error-border)]">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-11 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center transition-all font-bold text-sm shadow-lg"
                    >
                        {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 'Save Access'}
                    </button>
                </div>
            )}
        </div>
    );
}
