/**
 * Brand tokens for the Flux hero ad composition.
 *
 * Mirrors the dark-theme palette defined in `app/layout.tsx` so the video reads
 * as a first-class part of the product, not a detached asset. Kept as plain
 * constants (not CSS vars) because the Remotion <Player> renders the composition
 * into its own subtree where the app's `[data-flux-theme]` scope does not apply.
 */

export const COLORS = {
  bg: "#09090b",
  bgSubtle: "#18181b",
  surface: "#18181b",
  surfaceElevated: "#27272a",
  border: "#27272a",
  borderStrong: "#3f3f46",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  violet: "#a78bfa",
  violetSecondary: "#c4b5fd",
  fuchsia: "#f0abfc",
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
} as const;

/** Inherits the page's sans stack, with hard fallbacks for the isolated Player subtree. */
export const FONT_FAMILY =
  "var(--font-sans), 'Geist', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const FONT_MONO =
  "var(--font-mono), 'Geist Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/** Composition timing — single source of truth, also consumed by the <Player>. */
export const VIDEO = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 900, // 30s @ 30fps
} as const;

/** Scene boundaries in frames. Tile [0, 900) with no gaps. */
export const SCENES = {
  hook: { from: 0, duration: 135 }, // 0.0 – 4.5s
  describe: { from: 135, duration: 225 }, // 4.5 – 12.0s
  generate: { from: 360, duration: 240 }, // 12.0 – 20.0s
  benefits: { from: 600, duration: 180 }, // 20.0 – 26.0s
  cta: { from: 780, duration: 120 }, // 26.0 – 30.0s
} as const;
