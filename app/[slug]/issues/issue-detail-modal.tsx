'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, Bars3BottomLeftIcon, ClockIcon, UserPlusIcon, TagIcon, CheckIcon, ExclamationCircleIcon, BugAntIcon, LightBulbIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

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

interface IssueDetailModalProps {
    issue: Issue;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (issueId: string, data: Partial<any>) => void;
    members?: WorkspaceMember[];
    isReadOnly?: boolean;
}

const priorityColors = {
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
    LOW: 'bg-gray-100 text-gray-800 border-gray-200',
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'BUG': return <BugAntIcon className="w-4 h-4 text-red-500" />;
        case 'FEATURE': return <LightBulbIcon className="w-4 h-4 text-yellow-500" />;
        case 'IMPROVEMENT': return <BoltIcon className="w-4 h-4 text-blue-500" />;
        default: return <ExclamationCircleIcon className="w-4 h-4" />;
    }
};

export function IssueDetailModal({
    issue,
    isOpen,
    onClose,
    onUpdate,
    members = [],
    isReadOnly = false,
}: IssueDetailModalProps) {
    const { data: session } = useSession();
    const [title, setTitle] = useState(issue.title);
    const [description, setDescription] = useState(issue.description || '');

    useEffect(() => {
        setTitle(issue.title);
        setDescription(issue.description || '');
    }, [issue]);

    const handleSaveTitle = () => {
        if (title.trim() !== issue.title) {
            onUpdate(issue._id, { title });
        }
    };

    const handleSaveDescription = () => {
        if (description.trim() !== (issue.description || '')) {
            onUpdate(issue._id, { description });
        }
    };

    const handleSetAssignee = (memberId: string) => {
        const isAssigned = issue.assignee?.name === members.find((m) => m.userId === memberId)?.user?.name;
        if (isAssigned) {
            onUpdate(issue._id, { assigneeId: null });
        } else {
            onUpdate(issue._id, { assigneeId: memberId });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between p-8 border-b border-gray-100 bg-white">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] tracking-wider uppercase border border-slate-200 flex items-center gap-1.5">
                                            {getTypeIcon(issue.type)} {issue.type}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase border ${priorityColors[issue.priority]} flex items-center gap-1.5`}>
                                            {issue.priority}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        readOnly={isReadOnly}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSaveTitle}
                                        className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 placeholder-gray-300"
                                        placeholder="Issue Title"
                                    />
                                    <div className="text-xs text-gray-500 mt-2 font-medium">#{issue._id.slice(-6)} &bull; Reported by {issue.reporter?.name || 'A teammate'}</div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd]">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                    {/* Main Content */}
                                    <div className="md:col-span-8 space-y-10">
                                        {/* Description */}
                                        <div className="group">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 mb-3">
                                                <Bars3BottomLeftIcon className="w-4 h-4 text-gray-400" />
                                                Description
                                            </div>
                                            <textarea
                                                value={description}
                                                readOnly={isReadOnly}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={handleSaveDescription}
                                                placeholder={isReadOnly ? "No description provided." : "Add a more detailed description..."}
                                                className="w-full min-h-[160px] text-[15px] text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-[var(--brand-primary)]/5 focus:border-[var(--brand-primary)] transition-all resize-none shadow-sm"
                                            />
                                        </div>

                                        {/* Activity Info */}
                                        <div className="pt-8 border-t border-gray-100">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 mb-6">
                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                Timeline
                                            </div>

                                            <div className="pl-6 border-l-2 border-gray-50 ml-2 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-200 border-2 border-white" />
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        Reported on {new Date(issue.createdAt).toLocaleString(undefined, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="md:col-span-4 space-y-10">
                                        {/* Status */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                                <TagIcon className="w-3.5 h-3.5" />
                                                Status
                                            </div>
                                            <div className="space-y-2">
                                                {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                                                    <button
                                                        key={s}
                                                        disabled={isReadOnly}
                                                        onClick={() => onUpdate(issue._id, { status: s })}
                                                        className={`
                                                            w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all border
                                                            ${issue.status === s
                                                                ? 'bg-indigo-50 text-indigo-800 border-transparent shadow-lg shadow-indigo-500/5'
                                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                                                            }
                                                        `}
                                                    >
                                                        {s.replace('_', ' ')}
                                                        {issue.status === s && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignees */}
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                                <UserPlusIcon className="w-3.5 h-3.5" />
                                                Assignee
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {members.map((member) => {
                                                        const isAssigned = issue.assignee?.name === member.user?.name;
                                                        return (
                                                            <button
                                                                key={member.userId}
                                                                disabled={isReadOnly}
                                                                onClick={() => handleSetAssignee(member.userId)}
                                                                className={`
                                                                    w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left
                                                                    ${isAssigned ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}
                                                                `}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden shadow-sm border border-white">
                                                                    {member.user?.image ? (
                                                                        <img
                                                                            src={member.user.image}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                                            {member.user?.name?.charAt(0) || '?'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-[13px] font-semibold truncate ${isAssigned ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                                        {member.user?.name}
                                                                    </p>
                                                                </div>
                                                                <div className={`
                                                                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                                    ${isAssigned
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-slate-100 bg-white group-hover:border-slate-300'
                                                                    }
                                                                `}>
                                                                    {isAssigned && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                    {members.length === 0 && (
                                                        <div className="px-4 py-8 text-center">
                                                            <p className="text-xs text-gray-400 font-medium italic">No members available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
