'use client';

import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';

// Reusing Sidebar props interface
interface Workspace {
    id: string;
    name: string;
    slug: string;
    icon?: {
        type: 'upload' | 'emoji';
        url?: string;
        emoji?: string;
    };
}

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
}

interface MobileNavProps {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    boards: Board[];
    currentBoardSlug?: string;
    userRole?: 'ADMIN' | 'EDITOR' | 'VIEWER' | null;
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function MobileNav(props: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const closeRef = useRef<HTMLButtonElement | null>(null);

    // Focus management: focus close button on open, return focus to trigger on close.
    useEffect(() => {
        if (isOpen) {
            // Defer to next frame so the drawer is mounted before focusing.
            const id = window.requestAnimationFrame(() => {
                closeRef.current?.focus();
            });
            return () => window.cancelAnimationFrame(id);
        }
        // When closed, return focus to the trigger (only if it exists).
        triggerRef.current?.focus();
        return undefined;
    }, [isOpen]);

    const pageContextLabel = props.currentWorkspace?.name ?? 'Flux';

    return (
        <div className="md:hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)] border-b border-[var(--border-subtle)] bg-[var(--background)]">
                <div className="flex items-center gap-2">
                    <button
                        ref={triggerRef}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={isOpen}
                        aria-controls="mobile-nav-drawer"
                        className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                    >
                        <Bars3Icon className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                    <span className="font-semibold text-sm truncate max-w-[60vw]">
                        {pageContextLabel}
                    </span>
                </div>
            </div>

            {/* Off-canvas Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black z-40"
                        />

                        {/* Drawer */}
                        <motion.div
                            id="mobile-nav-drawer"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation menu"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[min(85vw,18rem)] bg-[var(--surface)] z-50 shadow-xl overflow-y-auto"
                        >
                            <div className="relative h-full flex flex-col">
                                <button
                                    ref={closeRef}
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close menu"
                                    className="absolute top-3 right-3 p-2.5 min-h-[44px] min-w-[44px] z-10 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background)] flex items-center justify-center"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                                <div onClick={(e) => {
                                    // If a link is clicked, close menu.
                                    // Using event delegation: check if anchor tag.
                                    const target = e.target as HTMLElement;
                                    if (target.closest('a')) {
                                        setIsOpen(false);
                                    }
                                }}>
                                    <Sidebar {...props} />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
