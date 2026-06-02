import type { ReactNode } from 'react';

interface StatTileProps {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
    /** Optional secondary line, e.g. "75% complete". */
    hint?: ReactNode;
}

/**
 * Compact metric tile shared by the workspace selector and workspace home.
 * Server-rendered (no client JS). Renders as a <dt>/<dd> pair so a grid of
 * these forms a semantic description list. The icon is hidden on the narrowest
 * screens to give short labels room to breathe in a 2-up mobile grid.
 */
export function StatTile({ label, value, icon, hint }: StatTileProps) {
    return (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--brand-primary)]/40">
            <div className="flex items-center gap-3">
                {icon && (
                    <span className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] sm:flex">
                        {icon}
                    </span>
                )}
                <div className="flex min-w-0 flex-col-reverse gap-1">
                    <dt className="truncate text-xs font-medium text-[var(--text-tertiary)]">{label}</dt>
                    <dd className="text-xl font-bold leading-none tabular-nums text-[var(--text-primary)] sm:text-2xl">
                        {value}
                    </dd>
                </div>
            </div>
            {hint && <p className="mt-2 text-[11px] leading-tight text-[var(--text-tertiary)]">{hint}</p>}
        </div>
    );
}
