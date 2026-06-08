'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilSquareIcon, XMarkIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { requestEditAccess } from '@/actions/access-control';

interface RequestAccessButtonProps {
    slug: string;
}

export function RequestAccessButton({ slug }: RequestAccessButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        startTransition(async () => {
            try {
                await requestEditAccess(slug, message || undefined);
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage('');
                    setSuccess(false);
                }, 1500);
            } catch (error) {
                console.error('Failed to request access:', error);
                alert(error instanceof Error ? error.message : 'Failed to request access');
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary"
            >
                <PencilSquareIcon className="w-4 h-4" />
                Request edit access
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isPending && setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-2xl">
                                <div className="p-6">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
                                                <PencilSquareIcon className="h-6 w-6 text-[var(--brand-primary)]" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-[var(--foreground)]">Request edit access</h2>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    Ask to become an editor
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => !isPending && setIsOpen(false)}
                                            aria-label="Close"
                                            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)]"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {success ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-8"
                                        >
                                            <div
                                                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
                                                style={{ background: 'var(--flux-success-bg)' }}
                                            >
                                                <CheckIcon className="h-6 w-6" style={{ color: 'var(--flux-success-primary)' }} />
                                            </div>
                                            <h3 className="font-semibold" style={{ color: 'var(--flux-success-text-strong)' }}>Request sent!</h3>
                                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                                The workspace owner will review your request.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    As an editor, you&apos;ll be able to create, edit, and move tasks
                                                    on the Kanban board. Your request will be sent to the workspace
                                                    owner for approval.
                                                </p>

                                                <div>
                                                    <label htmlFor="access-request-message" className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                                                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                        Add a message (optional)
                                                    </label>
                                                    <textarea
                                                        id="access-request-message"
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        placeholder="Tell the owner why you'd like edit access..."
                                                        className="input min-h-[100px] resize-none"
                                                        maxLength={500}
                                                    />
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                                                        {message.length}/500
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    onClick={() => setIsOpen(false)}
                                                    disabled={isPending}
                                                    className="btn btn-secondary flex-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isPending}
                                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                                >
                                                    {isPending ? (
                                                        <>
                                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        'Send Request'
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
