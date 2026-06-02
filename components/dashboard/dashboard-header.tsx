import type { ReactNode } from 'react';

interface DashboardHeaderProps {
    eyebrow?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    /** Right-aligned action slot (buttons, links). */
    actions?: ReactNode;
}

/**
 * Shared page header for dashboard surfaces. Stacks vertically on mobile and
 * splits into title / actions on >= sm. Keeps heading hierarchy consistent
 * (single h1 per page) so the surfaces feel like one product.
 */
export function DashboardHeader({ eyebrow, title, subtitle, actions }: DashboardHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                        {eyebrow}
                    </p>
                )}
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
                    {title}
                </h1>
                {subtitle && (
                    <div className="mt-1.5 text-sm text-[var(--text-secondary)] sm:text-base">{subtitle}</div>
                )}
            </div>
            {actions && <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">{actions}</div>}
        </div>
    );
}
