'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-[var(--brand-primary)] opacity-20">404</h1>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Page not found</h2>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                        >
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium text-[var(--foreground)]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
