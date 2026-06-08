/**
 * Shared color helpers for deriving brand-accent CSS variables.
 *
 * Used by both the server-rendered workspace layout (source of truth on
 * load/navigation) and the client-side settings picker (optimistic recolor),
 * so the two code paths stay perfectly in sync.
 */

const FALLBACK_RGB = '99, 102, 241'; // Indigo #6366f1

/**
 * Converts a 6-digit hex color (with or without leading '#') into an
 * "r, g, b" string suitable for `rgba(var(--brand-primary-rgb), …)` usage.
 * Falls back to the default indigo if the input is not a valid hex color.
 */
export function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return FALLBACK_RGB;
    }
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * Returns a slightly darkened shade of the given hex color, used as the
 * optimistic `--brand-primary-hover` value so hover/active states match the
 * chosen accent immediately. `amount` is the fraction (0–1) to darken by.
 * Falls back to the original input if it is not a valid hex color.
 */
export function darkenHex(hex: string, amount = 0.12): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return hex;
    }
    const factor = 1 - Math.min(Math.max(amount, 0), 1);
    const channel = (value: number): string =>
        Math.round(value * factor)
            .toString(16)
            .padStart(2, '0');
    const r = channel(parseInt(result[1], 16));
    const g = channel(parseInt(result[2], 16));
    const b = channel(parseInt(result[3], 16));
    return `#${r}${g}${b}`;
}
