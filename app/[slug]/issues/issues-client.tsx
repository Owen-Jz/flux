'use client';

import { useState } from 'react';
import { 
    Plus, 
    AlertCircle, 
    CheckCircle2, 
    Circle, 
    Clock, 
    Filter,
    Search,
    Bug,
    Lightbulb,
    Zap,
    X,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createIssue, updateIssueStatus } from '@/actions/issue';
import { useRouter } from 'next/navigation';

interface Issue {
    _id: string;
    title: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: 'BUG' | 'FEATURE' | 'IMPROVEMENT';
    reporter: { name: string; image?: string };
    assignee?: { name: string; image?: string };
    createdAt: string;
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
    initialIssues: any[]; // Using any to bypass some strict typing issues with serializable data
    workspaceName: string;
    workspaceMembers: WorkspaceMember[];
}

export function IssuesClient({ workspaceSlug, initialIssues, workspaceName, workspaceMembers }: IssuesClientProps) {
    const [issues, setIssues] = useState<Issue[]>(initialIssues);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

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
        } catch (error) {
            console.error('Failed to create issue', error);
            alert('Failed to create issue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (issueId: string, newStatus: any) => {
        // Optimistic update
        setIssues(issues.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
        try {
            await updateIssueStatus(workspaceSlug, issueId, newStatus);
            router.refresh();
        } catch (error) {
            console.error('Failed to update status', error);
            // Revert would go here
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'OPEN': return <Circle className="w-4 h-4 text-gray-400" />;
            case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'RESOLVED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'CLOSED': return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
            default: return <Circle className="w-4 h-4" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'BUG': return <Bug className="w-4 h-4 text-red-500" />;
            case 'FEATURE': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
            case 'IMPROVEMENT': return <Zap className="w-4 h-4 text-blue-500" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--background)]">
            {/* Header */}
            <header className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface)]">
                <div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[var(--brand-primary)]" />
                        Issues
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">Track bugs and improvements for {workspaceName}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4" /> New Issue
                </button>
            </header>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-[var(--border-subtle)] flex gap-4 items-center bg-[var(--background)]">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search issues..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 h-9 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 border-l border-[var(--border-subtle)] pl-4">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                filterStatus === status 
                                    ? 'bg-[var(--surface)] text-[var(--brand-primary)] ring-1 ring-[var(--border-subtle)]' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            {status === 'ALL' ? 'All Issues' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-3">
                    {filteredIssues.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-medium text-[var(--foreground)]">No issues found</h3>
                            <p className="text-sm">Create a new issue to get started.</p>
                        </div>
                    ) : (
                        filteredIssues.map(issue => (
                            <motion.div 
                                key={issue._id}
                                layout
                                className="group flex items-center gap-4 p-4 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="shrink-0 pt-1 self-start">
                                    {getTypeIcon(issue.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-[var(--foreground)] truncate">{issue.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                                            {issue.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                        <span className="flex items-center gap-1">#{issue._id.slice(-4)}</span>
                                        <span>•</span>
                                        <span>Opened by {issue.reporter?.name}</span>
                                        {issue.assignee && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 text-[var(--brand-primary)]">
                                                    Assigned to {issue.assignee.name}
                                                </span>
                                            </>
                                        )}
                                        <span>•</span>
                                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                    <select 
                                        value={issue.status}
                                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                                        className="bg-[var(--surface)] border border-[var(--border-subtle)] text-xs font-medium rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer hover:border-[var(--brand-primary)]/50 transition-colors"
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[var(--background)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden"
                        >
                            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface)]">
                                <h3 className="font-bold text-lg">Create New Issue</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-[var(--background)] rounded-lg text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateIssue} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Title</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="input"
                                        placeholder="Issue summary"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Type</label>
                                        <select 
                                            value={newType}
                                            onChange={e => setNewType(e.target.value as any)}
                                            className="input"
                                        >
                                            <option value="BUG">Bug</option>
                                            <option value="FEATURE">Feature</option>
                                            <option value="IMPROVEMENT">Improvement</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Priority</label>
                                        <select 
                                            value={newPriority}
                                            onChange={e => setNewPriority(e.target.value as any)}
                                            className="input"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Assignee</label>
                                    <select 
                                        value={newAssignee}
                                        onChange={e => setNewAssignee(e.target.value)}
                                        className="input"
                                    >
                                        <option value="">Unassigned</option>
                                        {workspaceMembers.map(m => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.user?.name || 'Unknown User'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Description</label>
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
                                        {isSubmitting ? 'Creating...' : 'Create Issue'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
