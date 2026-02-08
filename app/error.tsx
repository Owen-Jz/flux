'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Something went wrong!</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>
                <div className="p-4 bg-[var(--surface)] rounded-lg text-left mb-6 overflow-auto max-h-40 text-xs border border-[var(--border-subtle)] font-mono text-red-600">
                    {error.message || "Unknown error"}
                </div>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                    <RotateCcw className="w-4 h-4" />
                    Try again
                </button>
            </div>
        </div>
    );
}
