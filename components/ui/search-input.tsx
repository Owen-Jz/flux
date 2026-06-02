'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
}

/**
 * Reusable, accessible search field used across dashboard surfaces.
 * - 44px touch target on mobile (h-11), tighter on desktop (sm:h-10).
 * - Native `type="search"` semantics + explicit aria-label.
 * - Clear button appears only when there is a value to clear.
 */
export function SearchInput({
    value,
    onChange,
    placeholder = 'Search…',
    ariaLabel,
    className = '',
}: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
                type="search"
                inputMode="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel || placeholder}
                className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] pl-9 pr-9 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] sm:h-10"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background-subtle)] hover:text-[var(--text-primary)]"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
