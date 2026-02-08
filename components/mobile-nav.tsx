'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';

// Reusing Sidebar props interface
interface Workspace {
    id: string;
    name: string;
    slug: string;
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

    // Close on navigation (Sidebar links click)
    // We can add logic to close when route changes if needed, 
    // but Sidebar links use <Link> which doesn't trigger state change here automatically unless customized.
    // However, clicking inside sidebar usually means navigation.
    // We can wrap sidebar in a div that handles clicks? Or modify Sidebar to accept onClose?

    // For simplicity, we'll wrap Sidebar in an overlay and close on outside click.
    // Ideally Sidebar links should close it too.

    return (
        <div className="md:hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--background)]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    >
                        <Menu className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                    <span className="font-semibold text-sm">
                        {props.currentWorkspace?.name || 'Menu'}
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
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-64 bg-[var(--surface)] z-50 shadow-xl overflow-y-auto"
                        >
                            <div className="relative h-full flex flex-col">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-2 right-2 p-2 z-10 text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                {/* We reuse generic Sidebar. Note: Sidebar is h-screen, w-64 fixed. 
                                    We might need to adjust styles via props or class overrides if possible.
                                    The Sidebar component has strict styles: "w-64 h-screen ...". 
                                    This matches our drawer width perfectly. */}
                                <div onClick={(e) => {
                                    // If a link is clicked, close menu
                                    // Using event delegation check if anchor tag
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
