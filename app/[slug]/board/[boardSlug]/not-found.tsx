import Link from 'next/link';

export default function BoardNotFound() {
    return (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--background-subtle)] flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Board not found</h2>
                <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto">
                    This board may have been deleted or the link is incorrect.
                </p>
                <Link
                    href=".."
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-primary)] hover:underline"
                >
                    ← Back to workspace
                </Link>
            </div>
        </div>
    );
}
