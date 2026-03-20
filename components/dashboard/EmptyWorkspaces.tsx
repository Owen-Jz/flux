'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function EmptyWorkspaces() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative overflow-hidden">
            {/* Decorative background */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, var(--flux-brand-primary) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                }}
            />

            {/* Icon container */}
            <motion.div
                className="w-24 h-24 mb-8 rounded-2xl bg-gradient-to-br from-[var(--flux-brand-primary)] to-[var(--flux-brand-secondary)] flex items-center justify-center relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Inner icon */}
                <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>

                {/* Decorative ring */}
                <div className="absolute -inset-3 rounded-3xl border-2 border-[var(--flux-brand-primary)]/20" />
                <div className="absolute -inset-6 rounded-3xl border border-[var(--flux-brand-primary)]/10" />
            </motion.div>

            {/* Text content */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <p className="text-sm font-medium text-[var(--flux-brand-primary)] mb-2">
                    Get Started
                </p>
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                    No workspaces yet
                </h2>
                <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                    Create your first workspace to start organizing your projects, boards, and tasks with your team.
                </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Link
                    href="/onboarding"
                    className="btn btn-primary btn-lg inline-flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create your first workspace
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </motion.div>

            {/* Feature hints */}
            <motion.div
                className="flex items-center gap-8 mt-12 text-sm text-[var(--text-tertiary)]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--flux-success-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited boards
                </span>
                <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--flux-success-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Team collaboration
                </span>
                <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--flux-success-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free to start
                </span>
            </motion.div>
        </div>
    );
}
