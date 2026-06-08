import type { CSSProperties } from 'react';

interface RoleBadgeProps {
    role: string;
}

/**
 * Subtle, color-coded badge for a workspace role.
 * ADMIN  -> brand (owner / full access)
 * EDITOR -> info (can edit)
 * VIEWER -> neutral (read-only)
 */
export function RoleBadge({ role }: RoleBadgeProps) {
    const normalized = role.toUpperCase();

    let style: CSSProperties;
    let label: string;

    if (normalized === 'ADMIN') {
        style = {
            background: 'var(--flux-brand-primary)',
            color: '#fff',
        };
        label = 'Admin';
    } else if (normalized === 'EDITOR') {
        style = {
            background: 'var(--flux-info-bg)',
            color: 'var(--flux-info-text-strong)',
            borderColor: 'var(--flux-info-border)',
        };
        label = 'Editor';
    } else {
        style = {
            background: 'var(--background-subtle)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-subtle)',
        };
        label = normalized.charAt(0) + normalized.slice(1).toLowerCase();
    }

    return (
        <span
            className="inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold"
            style={style}
        >
            {label}
        </span>
    );
}
