'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyWorkspaces() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            {/* Illustration */}
            <div className="w-24 h-24 mb-6 rounded-2xl bg-[var(--background-subtle)] flex items-center justify-center">
                <svg
                    className="w-12 h-12 text-[var(--text-tertiary)]"
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
            </div>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                No workspaces yet
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                Create your first workspace to get started with organizing your projects, boards, and tasks.
            </p>

            <Link href="/onboarding">
                <Button size="lg" rightIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                }>
                    Create your first workspace
                </Button>
            </Link>
        </div>
    );
}
