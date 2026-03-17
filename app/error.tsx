'use client';

import { useEffect } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: number };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    // Determine if this is a known/expected error that we can show a friendly message for
    const isAuthError = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isNotFoundError = error.message?.includes('not found') || error.message?.includes('Not found');
    const isPermissionError = error.message?.includes('permission') || error.message?.includes('Permission') || error.message?.includes('do not have');

    const getUserFriendlyMessage = () => {
        if (isAuthError) {
            return 'Your session may have expired. Please try logging in again.';
        }
        if (isNotFoundError) {
            return 'The requested resource could not be found.';
        }
        if (isPermissionError) {
            return "You don't have permission to perform this action.";
        }
        return 'An unexpected error occurred. Please try again.';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    {isAuthError ? 'Authentication Required' : isNotFoundError ? 'Resource Not Found' : isPermissionError ? 'Access Denied' : 'Something went wrong'}
                </h2>
                <p className="text-[var(--text-secondary)] mb-2">
                    {getUserFriendlyMessage()}
                </p>
                {/* Show technical error for debugging but in a less prominent way */}
                <details className="mb-6 text-left">
                    <summary className="text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--foreground)]">
                        Technical details
                    </summary>
                    <div className="mt-2 p-3 bg-[var(--surface)] rounded-lg text-xs border border-[var(--border-subtle)] font-mono text-red-500 overflow-auto max-h-32">
                        {error.message || 'Unknown error'}
                    </div>
                </details>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Try again
                    </button>
                    {isAuthError && (
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-2.5 border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium text-[var(--foreground)]"
                        >
                            <ExclamationCircleIcon className="w-4 h-4" />
                            Log in
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
