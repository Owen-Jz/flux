'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { TaskPriority, TaskStatus } from '@/models/Task';
import type { Member } from './task-card';

type ColumnId = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: {
        title: string;
        description?: string;
        priority: TaskPriority;
        status: TaskStatus;
        assignees: Member[];
    }) => void;
    members: Member[];
    columns: { id: ColumnId; title: string }[];
    defaultColumn?: ColumnId;
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

export function CreateTaskModal({
    isOpen,
    onClose,
    onSubmit,
    members,
    columns,
    defaultColumn = 'TODO',
}: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
    const [status, setStatus] = useState<TaskStatus>(defaultColumn);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    const handleSubmit = () => {
        if (!title.trim()) return;

        const assignees = members.filter(m => selectedAssignees.includes(m.id));
        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            status,
            assignees,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus(defaultColumn);
        setSelectedAssignees([]);
        onClose();
    };

    const toggleAssignee = (memberId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                                <h2 className="text-lg font-bold text-[var(--foreground)]">Create New Task</h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Column Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                        Column
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                                    >
                                        {columns.map(col => (
                                            <option key={col.id} value={col.id}>
                                                {col.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter task title..."
                                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a description..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] resize-none"
                                    />
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                        Priority
                                    </label>
                                    <div className="flex gap-2">
                                        {priorityOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setPriority(opt.value)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    priority === opt.value
                                                        ? opt.color + ' ring-2 ring-inset ring-black/5 shadow-sm scale-105'
                                                        : 'bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assignees */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                        Assignees
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-subtle)] text-sm hover:border-[var(--text-secondary)] transition-colors"
                                        >
                                            <span className="text-[var(--text-secondary)]">
                                                {selectedAssignees.length === 0
                                                    ? 'Select assignees...'
                                                    : `${selectedAssignees.length} selected`}
                                            </span>
                                            <ChevronDownIcon className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showAssigneeDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] shadow-xl z-10 max-h-48 overflow-y-auto"
                                                >
                                                    {members.length > 0 ? (
                                                        members.map(member => (
                                                            <button
                                                                key={member.id}
                                                                onClick={() => toggleAssignee(member.id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-[var(--background-subtle)] transition-colors ${
                                                                    selectedAssignees.includes(member.id)
                                                                        ? 'bg-[var(--flux-info-bg)] text-[var(--flux-info-text-strong)]'
                                                                        : 'text-[var(--foreground)]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)] overflow-hidden flex-shrink-0">
                                                                        {member.image ? (
                                                                            <img
                                                                                src={member.image}
                                                                                alt={member.name}
                                                                                className="w-full h-full object-cover"
                                                                                referrerPolicy="no-referrer"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary)] text-white text-xs font-bold">
                                                                                {member.name.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span>{member.name}</span>
                                                                </div>
                                                                {selectedAssignees.includes(member.id) && (
                                                                    <CheckIcon className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-4 text-center text-sm text-[var(--text-tertiary)]">
                                                            No members found
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Selected Assignees Preview */}
                                    {selectedAssignees.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedAssignees.map(id => {
                                                const member = members.find(m => m.id === id);
                                                if (!member) return null;
                                                return (
                                                    <div
                                                        key={id}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--background-subtle)] text-[10px] font-medium text-[var(--text-secondary)]"
                                                    >
                                                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                            {member.image ? (
                                                                <img
                                                                    src={member.image}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary)] text-white text-[8px] font-bold">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span>{member.name.split(' ')[0]}</span>
                                                        <button
                                                            onClick={() => toggleAssignee(id)}
                                                            className="ml-0.5 hover:text-red-500"
                                                        >
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-subtle)] bg-[var(--background-subtle)]">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!title.trim()}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
