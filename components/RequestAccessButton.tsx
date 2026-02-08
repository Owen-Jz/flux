'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Loader2, MessageSquare } from 'lucide-react';
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
            } catch (error: any) {
                console.error('Failed to request access:', error);
                alert(error.message || 'Failed to request access');
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary flex items-center gap-2"
            >
                <Edit3 className="w-4 h-4" />
                Request Edit Access
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
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10">
                                                <Edit3 className="w-5 h-5 text-[var(--brand-primary)]" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold">Request Edit Access</h2>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    Ask to become an editor
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => !isPending && setIsOpen(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {success ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-8"
                                        >
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                                                <Edit3 className="w-6 h-6 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-green-600">Request Sent!</h3>
                                            <p className="text-sm text-[var(--text-secondary)] mt-1">
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
                                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Add a message (optional)
                                                    </label>
                                                    <textarea
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
                                                            <Loader2 className="w-4 h-4 animate-spin" />
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
