import Link from 'next/link';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Rendered when a workspace can't be loaded — it was deleted, never existed, or
// the user no longer has access. Reached via notFound() from the workspace
// layout and page, so it replaces the (now-invalid) sidebar shell entirely.
export default function WorkspaceNotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10">
                <ExclamationTriangleIcon className="h-8 w-8 text-[var(--brand-primary)]" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Workspace unavailable
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                This workspace may have been deleted, or you no longer have access to it.
                If you think this is a mistake, ask a workspace admin to re-invite you.
            </p>

            <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-primary)]/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--brand-primary)]/40 active:scale-[0.98]"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to your workspaces
            </Link>
        </div>
    );
}
