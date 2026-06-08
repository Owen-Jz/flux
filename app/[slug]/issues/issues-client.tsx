'use client';

import { useState } from 'react';
import {
    PlusIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    BugAntIcon,
    LightBulbIcon,
    BoltIcon,
    XMarkIcon,
    InboxIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createIssue, updateIssueStatus, moveIssueToBoard, updateIssue, addIssueComment } from '@/actions/issue';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { IssueDetailModal, IssueComment } from './issue-detail-modal';
import CustomSelect from '@/components/ui/custom-select';

interface BoardData {
    id: string;
    name: string;
    slug: string;
}

type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IssueType = 'BUG' | 'FEATURE' | 'IMPROVEMENT';

interface IssuePerson {
    name: string;
    image?: string;
}

interface Issue {
    _id: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    reporter: IssuePerson;
    assignee?: IssuePerson;
    comments: IssueComment[];
    createdAt: string;
}

/**
 * Shape of an issue exactly as returned by `getIssues` in actions/issue.ts
 * (Mongoose lean() + manual serialization → JSON-safe primitives).
 */
interface SerializedIssue {
    _id: string;
    workspaceId: string;
    title: string;
    description: string | null;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    reporterId: string | null;
    reporter: { name: string; image: string | null } | null;
    assigneeId: string | null;
    assignee: { name: string; image: string | null } | null;
    comments: IssueComment[];
    createdAt: string;
    updatedAt: string;
}

/** Fields the detail modal / inline controls are allowed to mutate. */
type IssueUpdateData = Partial<{
    title: string;
    description: string;
    priority: IssuePriority;
    type: IssueType;
    status: IssueStatus;
    assigneeId: string | null;
}>;

/** Normalize a serialized person into the non-null shape the UI/modal expects. */
function toIssuePerson(person: { name: string; image: string | null } | null): IssuePerson | undefined {
    if (!person) return undefined;
    return { name: person.name, image: person.image ?? undefined };
}

/** Map the server's serialized issue into the client-side working shape. */
function toIssue(issue: SerializedIssue): Issue {
    return {
        _id: issue._id,
        title: issue.title,
        description: issue.description ?? undefined,
        status: issue.status,
        priority: issue.priority,
        type: issue.type,
        reporter: toIssuePerson(issue.reporter) ?? { name: 'A teammate' },
        assignee: toIssuePerson(issue.assignee),
        comments: issue.comments ?? [],
        createdAt: issue.createdAt,
    };
}

interface WorkspaceMember {
    userId: string;
    user: {
        name: string;
        email: string;
        image?: string;
    } | null;
}

interface IssuesClientProps {
    workspaceSlug: string;
    initialIssues: SerializedIssue[];
    workspaceName: string;
    workspaceMembers: WorkspaceMember[];
    boards: BoardData[];
    /** When true the viewer is a guest / VIEWER: render a view-only list with no mutating controls. */
    isReadOnly?: boolean;
}

export function IssuesClient({ workspaceSlug, initialIssues, workspaceName, workspaceMembers, boards, isReadOnly = false }: IssuesClientProps) {
    const [issues, setIssues] = useState<Issue[]>(() => initialIssues.map(toIssue));
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { data: session } = useSession();

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
    const [newType, setNewType] = useState<'BUG' | 'FEATURE' | 'IMPROVEMENT'>('BUG');
    const [newAssignee, setNewAssignee] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredIssues = issues.filter(issue => {
        const matchesStatus = filterStatus === 'ALL' || issue.status === filterStatus;
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleCreateIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setIsSubmitting(true);
        try {
            await createIssue(workspaceSlug, {
                title: newTitle,
                description: newDesc,
                priority: newPriority,
                type: newType,
                assigneeId: newAssignee || undefined
            });

            // Refresh logic - ideally we'd get the new issue back or revalidate
            // Simple approach: close modal and refresh router
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewDesc('');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create issue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
        // Optimistic update
        setIssues(issues.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
        try {
            await updateIssueStatus(workspaceSlug, issueId, newStatus);
            router.refresh();
        } catch (err) {
            // Revert the optimistic update
            setIssues(issues);
            setError(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const handleUpdateIssue = async (issueId: string, data: IssueUpdateData) => {
        let assigneeObj: IssuePerson | undefined = undefined;
        let setAssignee = false;
        if ('assigneeId' in data) {
            setAssignee = true;
            if (data.assigneeId === null) {
                assigneeObj = undefined;
            } else {
                const member = workspaceMembers.find(m => m.userId === data.assigneeId);
                if (member && member.user) assigneeObj = { name: member.user.name, image: member.user.image || undefined };
            }
        }

        setIssues(issues.map(i => {
            if (i._id === issueId) {
                const updated = { ...i, ...data };
                if (setAssignee) updated.assignee = assigneeObj;
                return updated;
            }
            return i;
        }));

        if (selectedIssue && selectedIssue._id === issueId) {
            const updated = { ...selectedIssue, ...data };
            if (setAssignee) updated.assignee = assigneeObj;
            setSelectedIssue(updated as Issue);
        }

        try {
            await updateIssue(workspaceSlug, issueId, data);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update issue');
        }
    };

    const setIssueComments = (issueId: string, comments: IssueComment[]) => {
        setIssues(prev => prev.map(i => (i._id === issueId ? { ...i, comments } : i)));
        setSelectedIssue(prev => (prev && prev._id === issueId ? { ...prev, comments } : prev));
    };

    const handleAddComment = async (issueId: string, content: string) => {
        const target = issues.find(i => i._id === issueId);
        const baseComments = target?.comments ?? selectedIssue?.comments ?? [];

        const optimistic: IssueComment = {
            id: `temp-${Date.now()}`,
            content,
            userId: session?.user?.id ?? '',
            user: {
                id: session?.user?.id ?? '',
                name: session?.user?.name ?? 'You',
                email: session?.user?.email ?? '',
                image: session?.user?.image ?? null,
            },
            createdAt: new Date().toISOString(),
        };

        // Optimistic: render the comment instantly.
        setIssueComments(issueId, [...baseComments, optimistic]);

        try {
            const saved = await addIssueComment(workspaceSlug, issueId, content);
            // Swap the optimistic placeholder for the persisted comment.
            setIssueComments(issueId, [...baseComments, saved]);
            router.refresh();
        } catch (err) {
            // Roll back the optimistic comment and surface the error.
            setIssueComments(issueId, baseComments);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
            throw err;
        }
    };

    const handleMoveToBoard = async (issueId: string, boardId: string, boardName: string) => {
        if (!confirm(`Are you sure you want to move this issue to the ${boardName} board? It will be converted into a backlog task.`)) {
            return;
        }

        // Optimistic update
        setIssues(issues.filter(i => i._id !== issueId));
        try {
            await moveIssueToBoard(workspaceSlug, issueId, boardId);
            router.refresh();
        } catch (err) {
            // Restore the issue on error
            router.refresh();
            setError(err instanceof Error ? err.message : 'Failed to move issue to board');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'BUG': return <BugAntIcon className="w-4 h-4 text-red-500" />;
            case 'FEATURE': return <LightBulbIcon className="w-4 h-4 text-amber-500" />;
            case 'IMPROVEMENT': return <BoltIcon className="w-4 h-4 text-blue-500" />;
            default: return <InboxIcon className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'LOW': return 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
            case 'MEDIUM': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'HIGH': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
            case 'CRITICAL': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            default: return 'bg-[var(--background-subtle)]';
        }
    };

    const STATUS_DOT: Record<IssueStatus, string> = {
        OPEN: 'var(--text-tertiary)',
        IN_PROGRESS: '#3b82f6',
        RESOLVED: '#22c55e',
        CLOSED: 'var(--text-tertiary)',
    };

    const STATUS_OPTIONS = [
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' },
    ];

    return (
        <div className="h-full flex flex-col bg-[var(--background)] overflow-x-hidden">
            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                        <InboxIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-4 md:px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--surface)]">
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="w-4.5 h-4.5 text-[var(--brand-primary)]" />
                        </span>
                        Feedback
                    </h1>
                    <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 hidden md:block">
                        Capture bugs &amp; feature requests for {workspaceName}, then convert them into board tasks when you&apos;re ready.
                    </p>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary text-sm w-full sm:w-auto justify-center"
                    >
                        <PlusIcon className="w-4 h-4" /> New Feedback
                    </button>
                )}
            </header>

            {/* Filters */}
            <div className="px-4 md:px-6 py-3 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-[var(--surface)]">
                <div className="relative flex-1 min-w-0">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 h-9 text-sm w-full"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background-subtle)] border border-[var(--border-subtle)] overflow-x-auto">
                    <FunnelIcon className="w-4 h-4 text-[var(--text-tertiary)] ml-1.5 hidden sm:block flex-shrink-0" />
                    {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-2.5 md:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${filterStatus === status
                                ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--background)]">
                <div className="max-w-5xl mx-auto">
                    {filteredIssues.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <div className="w-16 h-16 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <InboxIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">
                                {issues.length === 0 ? 'No feedback yet' : 'No matching feedback'}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                                {issues.length === 0
                                    ? (isReadOnly
                                        ? 'No feedback has been submitted for this workspace yet.'
                                        : 'Capture bugs & feature requests here, then convert them into board tasks when you’re ready.')
                                    : 'Try a different search term or status filter.'}
                            </p>
                            {issues.length === 0 && !isReadOnly && (
                                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary text-sm mt-5 mx-auto">
                                    <PlusIcon className="w-4 h-4" /> New Feedback
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredIssues.map(issue => (
                                <motion.div
                                    key={issue._id}
                                    layout
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedIssue(issue)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIssue(issue); } }}
                                    className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 md:p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--brand-primary)]/40 hover:shadow-sm focus-visible:border-[var(--brand-primary)]/50 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all cursor-pointer outline-none"
                                >
                                    {/* Type icon */}
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--background-subtle)] border border-[var(--border-subtle)] flex items-center justify-center self-start sm:self-center">
                                        {getTypeIcon(issue.type)}
                                    </div>

                                    {/* Main */}
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_DOT[issue.status] }} title={issue.status} />
                                            <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)] transition-colors">{issue.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                                                {issue.priority}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--text-tertiary)]">
                                            <span className="font-medium">#{issue._id.slice(-4)}</span>
                                            <span aria-hidden>•</span>
                                            <span className="truncate max-w-[140px]">{issue.reporter?.name}</span>
                                            {issue.assignee && (
                                                <>
                                                    <span aria-hidden>•</span>
                                                    <span className="flex items-center gap-1 text-[var(--brand-primary)] font-medium truncate max-w-[140px]">
                                                        → {issue.assignee.name}
                                                    </span>
                                                </>
                                            )}
                                            {issue.comments.length > 0 && (
                                                <>
                                                    <span aria-hidden>•</span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <ChatBubbleOvalLeftIcon className="w-3.5 h-3.5" />
                                                        {issue.comments.length}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions — hidden for read-only guests/viewers */}
                                    {!isReadOnly && (
                                    <div
                                        className="shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {boards.length > 0 && (
                                            <div className="flex-1 sm:flex-none sm:w-[150px]">
                                                <CustomSelect
                                                    value=""
                                                    placeholder="Convert to task"
                                                    onChange={(value) => {
                                                        const board = boards.find(b => b.id === value);
                                                        if (board) handleMoveToBoard(issue._id, board.id, board.name);
                                                    }}
                                                    options={boards.map(b => ({ value: b.id, label: b.name }))}
                                                    minWidth="100%"
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 sm:flex-none sm:w-[140px]">
                                            <CustomSelect
                                                value={issue.status}
                                                onChange={(value) => handleStatusChange(issue._id, value as IssueStatus)}
                                                options={STATUS_OPTIONS}
                                                minWidth="100%"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCreateModalOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--surface)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden max-h-[92vh] flex flex-col"
                        >
                            <div className="p-4 md:p-5 border-b border-[var(--border-subtle)] flex justify-between items-center">
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">Submit Feedback</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} aria-label="Close" className="p-1.5 hover:bg-[var(--background-subtle)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateIssue} className="p-5 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="input"
                                        placeholder="Short summary of the feedback"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Type</label>
                                        <CustomSelect
                                            value={newType}
                                            onChange={(v) => setNewType(v as IssueType)}
                                            options={[
                                                { value: 'BUG', label: 'Bug' },
                                                { value: 'FEATURE', label: 'Feature' },
                                                { value: 'IMPROVEMENT', label: 'Improvement' },
                                            ]}
                                            minWidth="100%"
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Priority</label>
                                        <CustomSelect
                                            value={newPriority}
                                            onChange={(v) => setNewPriority(v as IssuePriority)}
                                            options={[
                                                { value: 'LOW', label: 'Low' },
                                                { value: 'MEDIUM', label: 'Medium' },
                                                { value: 'HIGH', label: 'High' },
                                                { value: 'CRITICAL', label: 'Critical' },
                                            ]}
                                            minWidth="100%"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Assignee</label>
                                    <CustomSelect
                                        value={newAssignee}
                                        onChange={(v) => setNewAssignee(v)}
                                        placeholder="Unassigned"
                                        options={[
                                            { value: '', label: 'Unassigned' },
                                            ...workspaceMembers.map(m => ({ value: m.userId, label: m.user?.name || 'Unknown User' })),
                                        ]}
                                        minWidth="100%"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Description</label>
                                    <textarea
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        className="input min-h-[100px] resize-none"
                                        placeholder="Add details..."
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-primary"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            <AnimatePresence>
                {selectedIssue && (
                    <IssueDetailModal
                        issue={selectedIssue}
                        isOpen={!!selectedIssue}
                        onClose={() => setSelectedIssue(null)}
                        onUpdate={handleUpdateIssue}
                        onAddComment={handleAddComment}
                        members={workspaceMembers}
                        isReadOnly={isReadOnly}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
