/**
 * Flux Theme System - Light Mode Only
 *
 * Dark mode has been disabled for the landing page to optimize conversion rates.
 * All components use light theme by default.
 *
 * This implementation ensures complete visual and functional separation between
 * light and dark themes by using:
 * 1. Theme-prefixed CSS custom properties (e.g., --flux-light-bg)
 * 2. Explicit theme class scoping on all components
 * 3. A robust theme-switching mechanism that clears previous theme state
 * 4. Instant theme transitions with no artifacts or bleeding
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';

/** Theme type - light mode only enforced */
type Theme = 'light';

/** Theme context type with full API - light mode enforced */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
  isDarkModeAvailable: boolean; // Always false - dark mode disabled
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Storage key for theme persistence */
const THEME_STORAGE_KEY = 'flux-theme';

/** CSS variable prefix for isolation */
const CSS_VAR_PREFIX = 'flux';

/**
 * Theme CSS custom properties - completely isolated for each theme
 * Light theme uses --flux-light-* variables
 * Dark theme uses --flux-dark-* variables
 */
const LIGHT_THEME_VARS: Record<string, string> = {
  /** Brand Colors */
  [`--${CSS_VAR_PREFIX}-light-brand-primary`]: '#6366f1',
  [`--${CSS_VAR_PREFIX}-light-brand-primary-hover`]: '#4f46e5',
  [`--${CSS_VAR_PREFIX}-light-brand-primary-active`]: '#4338ca',
  [`--${CSS_VAR_PREFIX}-light-brand-secondary`]: '#8b5cf6',
  [`--${CSS_VAR_PREFIX}-light-brand-accent`]: '#f472b6',

  /** Backgrounds */
  [`--${CSS_VAR_PREFIX}-light-bg`]: '#fafafa',
  [`--${CSS_VAR_PREFIX}-light-bg-subtle`]: '#f4f4f5',
  [`--${CSS_VAR_PREFIX}-light-surface`]: '#ffffff',
  [`--${CSS_VAR_PREFIX}-light-surface-elevated`]: '#ffffff',

  /** Foreground / Text */
  [`--${CSS_VAR_PREFIX}-light-fg`]: '#18181b',
  [`--${CSS_VAR_PREFIX}-light-fg-muted`]: '#52525b',
  [`--${CSS_VAR_PREFIX}-light-text-primary`]: '#18181b',
  [`--${CSS_VAR_PREFIX}-light-text-secondary`]: '#71717a',
  [`--${CSS_VAR_PREFIX}-light-text-tertiary`]: '#a1a1aa',
  [`--${CSS_VAR_PREFIX}-light-text-inverse`]: '#ffffff',

  /** Borders */
  [`--${CSS_VAR_PREFIX}-light-border-subtle`]: '#e4e4e7',
  [`--${CSS_VAR_PREFIX}-light-border-default`]: '#d4d4d8',
  [`--${CSS_VAR_PREFIX}-light-border-strong`]: '#a1a1aa',

  /** Success */
  [`--${CSS_VAR_PREFIX}-light-success-bg`]: '#f0fdf4',
  [`--${CSS_VAR_PREFIX}-light-success-bg-subtle`]: '#dcfce7',
  [`--${CSS_VAR_PREFIX}-light-success-border`]: '#86efac',
  [`--${CSS_VAR_PREFIX}-light-success-text`]: '#166534',
  [`--${CSS_VAR_PREFIX}-light-success-text-strong`]: '#15803d',
  [`--${CSS_VAR_PREFIX}-light-success-primary`]: '#22c55e',

  /** Warning */
  [`--${CSS_VAR_PREFIX}-light-warning-bg`]: '#fffbeb',
  [`--${CSS_VAR_PREFIX}-light-warning-bg-subtle`]: '#fef3c7',
  [`--${CSS_VAR_PREFIX}-light-warning-border`]: '#fcd34d',
  [`--${CSS_VAR_PREFIX}-light-warning-text`]: '#92400e',
  [`--${CSS_VAR_PREFIX}-light-warning-text-strong`]: '#b45309',
  [`--${CSS_VAR_PREFIX}-light-warning-primary`]: '#f59e0b',

  /** Error */
  [`--${CSS_VAR_PREFIX}-light-error-bg`]: '#fef2f2',
  [`--${CSS_VAR_PREFIX}-light-error-bg-subtle`]: '#fee2e2',
  [`--${CSS_VAR_PREFIX}-light-error-border`]: '#fca5a5',
  [`--${CSS_VAR_PREFIX}-light-error-text`]: '#991b1b',
  [`--${CSS_VAR_PREFIX}-light-error-text-strong`]: '#b91c1c',
  [`--${CSS_VAR_PREFIX}-light-error-primary`]: '#ef4444',

  /** Info */
  [`--${CSS_VAR_PREFIX}-light-info-bg`]: '#eff6ff',
  [`--${CSS_VAR_PREFIX}-light-info-bg-subtle`]: '#dbeafe',
  [`--${CSS_VAR_PREFIX}-light-info-border`]: '#93c5fd',
  [`--${CSS_VAR_PREFIX}-light-info-text`]: '#1e40af',
  [`--${CSS_VAR_PREFIX}-light-info-text-strong`]: '#1d4ed8',
  [`--${CSS_VAR_PREFIX}-light-info-primary`]: '#3b82f6',

  /** Priority */
  [`--${CSS_VAR_PREFIX}-light-priority-high`]: '#ef4444',
  [`--${CSS_VAR_PREFIX}-light-priority-medium`]: '#f59e0b',
  [`--${CSS_VAR_PREFIX}-light-priority-low`]: '#3b82f6',

  /** Shadows */
  [`--${CSS_VAR_PREFIX}-light-shadow-xs`]: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  [`--${CSS_VAR_PREFIX}-light-shadow-sm`]: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  [`--${CSS_VAR_PREFIX}-light-shadow-md`]: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
  [`--${CSS_VAR_PREFIX}-light-shadow-lg`]: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  [`--${CSS_VAR_PREFIX}-light-shadow-xl`]: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  [`--${CSS_VAR_PREFIX}-light-shadow-2xl`]: '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  /** Focus Ring */
  [`--${CSS_VAR_PREFIX}-light-focus-ring`]: '0 0 0 3px rgba(99, 102, 241, 0.4)',
  [`--${CSS_VAR_PREFIX}-light-focus-ring-success`]: '0 0 0 3px rgba(34, 197, 94, 0.4)',
  [`--${CSS_VAR_PREFIX}-light-focus-ring-error`]: '0 0 0 3px rgba(239, 68, 68, 0.4)',

  /** Glass Effect */
  [`--${CSS_VAR_PREFIX}-light-glass-bg`]: 'rgba(255, 255, 255, 0.7)',
  [`--${CSS_VAR_PREFIX}-light-glass-border`]: 'rgba(255, 255, 255, 0.3)',

  /** Scrollbar */
  [`--${CSS_VAR_PREFIX}-light-scrollbar-track`]: '#f4f4f5',
  [`--${CSS_VAR_PREFIX}-light-scrollbar-thumb`]: '#d4d4d8',
  [`--${CSS_VAR_PREFIX}-light-scrollbar-thumb-hover`]: '#a1a1aa',
};

const DARK_THEME_VARS: Record<string, string> = {
  /** Brand Colors (brighter for dark mode) */
  [`--${CSS_VAR_PREFIX}-dark-brand-primary`]: '#818cf8',
  [`--${CSS_VAR_PREFIX}-dark-brand-primary-hover`]: '#6366f1',
  [`--${CSS_VAR_PREFIX}-dark-brand-primary-active`]: '#4f46e5',
  [`--${CSS_VAR_PREFIX}-dark-brand-secondary`]: '#a78bfa',
  [`--${CSS_VAR_PREFIX}-dark-brand-accent`]: '#f472b6',

  /** Backgrounds */
  [`--${CSS_VAR_PREFIX}-dark-bg`]: '#09090b',
  [`--${CSS_VAR_PREFIX}-dark-bg-subtle`]: '#18181b',
  [`--${CSS_VAR_PREFIX}-dark-surface`]: '#18181b',
  [`--${CSS_VAR_PREFIX}-dark-surface-elevated`]: '#27272a',

  /** Foreground / Text */
  [`--${CSS_VAR_PREFIX}-dark-fg`]: '#fafafa',
  [`--${CSS_VAR_PREFIX}-dark-fg-muted`]: '#a1a1aa',
  [`--${CSS_VAR_PREFIX}-dark-text-primary`]: '#fafafa',
  [`--${CSS_VAR_PREFIX}-dark-text-secondary`]: '#a1a1aa',
  [`--${CSS_VAR_PREFIX}-dark-text-tertiary`]: '#71717a',
  [`--${CSS_VAR_PREFIX}-dark-text-inverse`]: '#18181b',

  /** Borders */
  [`--${CSS_VAR_PREFIX}-dark-border-subtle`]: '#27272a',
  [`--${CSS_VAR_PREFIX}-dark-border-default`]: '#3f3f46',
  [`--${CSS_VAR_PREFIX}-dark-border-strong`]: '#52525b',

  /** Success (darker variants) */
  [`--${CSS_VAR_PREFIX}-dark-success-bg`]: '#052e16',
  [`--${CSS_VAR_PREFIX}-dark-success-bg-subtle`]: '#14532d',
  [`--${CSS_VAR_PREFIX}-dark-success-border`]: '#22c55e',
  [`--${CSS_VAR_PREFIX}-dark-success-text`]: '#86efac',
  [`--${CSS_VAR_PREFIX}-dark-success-text-strong`]: '#4ade80',
  [`--${CSS_VAR_PREFIX}-dark-success-primary`]: '#22c55e',

  /** Warning (darker variants) */
  [`--${CSS_VAR_PREFIX}-dark-warning-bg`]: '#451a03',
  [`--${CSS_VAR_PREFIX}-dark-warning-bg-subtle`]: '#78350f',
  [`--${CSS_VAR_PREFIX}-dark-warning-border`]: '#d97706',
  [`--${CSS_VAR_PREFIX}-dark-warning-text`]: '#fde047',
  [`--${CSS_VAR_PREFIX}-dark-warning-text-strong`]: '#fbbf24',
  [`--${CSS_VAR_PREFIX}-dark-warning-primary`]: '#f59e0b',

  /** Error (darker variants) */
  [`--${CSS_VAR_PREFIX}-dark-error-bg`]: '#450a0a',
  [`--${CSS_VAR_PREFIX}-dark-error-bg-subtle`]: '#7f1d1d',
  [`--${CSS_VAR_PREFIX}-dark-error-border`]: '#dc2626',
  [`--${CSS_VAR_PREFIX}-dark-error-text`]: '#fca5a5',
  [`--${CSS_VAR_PREFIX}-dark-error-text-strong`]: '#f87171',
  [`--${CSS_VAR_PREFIX}-dark-error-primary`]: '#ef4444',

  /** Info (darker variants) */
  [`--${CSS_VAR_PREFIX}-dark-info-bg`]: '#172554',
  [`--${CSS_VAR_PREFIX}-dark-info-bg-subtle`]: '#1e3a8a',
  [`--${CSS_VAR_PREFIX}-dark-info-border`]: '#2563eb',
  [`--${CSS_VAR_PREFIX}-dark-info-text`]: '#93c5fd',
  [`--${CSS_VAR_PREFIX}-dark-info-text-strong`]: '#60a5fa',
  [`--${CSS_VAR_PREFIX}-dark-info-primary`]: '#3b82f6',

  /** Priority (brighter for dark mode) */
  [`--${CSS_VAR_PREFIX}-dark-priority-high`]: '#f87171',
  [`--${CSS_VAR_PREFIX}-dark-priority-medium`]: '#fbbf24',
  [`--${CSS_VAR_PREFIX}-dark-priority-low`]: '#60a5fa',

  /** Shadows (adjusted for dark mode) */
  [`--${CSS_VAR_PREFIX}-dark-shadow-xs`]: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  [`--${CSS_VAR_PREFIX}-dark-shadow-sm`]: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  [`--${CSS_VAR_PREFIX}-dark-shadow-md`]: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
  [`--${CSS_VAR_PREFIX}-dark-shadow-lg`]: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
  [`--${CSS_VAR_PREFIX}-dark-shadow-xl`]: '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)',
  [`--${CSS_VAR_PREFIX}-dark-shadow-2xl`]: '0 25px 50px -12px rgb(0 0 0 / 0.8)',

  /** Focus Ring (adjusted for dark mode) */
  [`--${CSS_VAR_PREFIX}-dark-focus-ring`]: '0 0 0 3px rgba(129, 140, 248, 0.5)',
  [`--${CSS_VAR_PREFIX}-dark-focus-ring-success`]: '0 0 0 3px rgba(34, 197, 94, 0.5)',
  [`--${CSS_VAR_PREFIX}-dark-focus-ring-error`]: '0 0 0 3px rgba(239, 68, 68, 0.5)',

  /** Glass Effect (darker) */
  [`--${CSS_VAR_PREFIX}-dark-glass-bg`]: 'rgba(24, 24, 27, 0.8)',
  [`--${CSS_VAR_PREFIX}-dark-glass-border`]: 'rgba(255, 255, 255, 0.1)',

  /** Scrollbar (darker) */
  [`--${CSS_VAR_PREFIX}-dark-scrollbar-track`]: '#18181b',
  [`--${CSS_VAR_PREFIX}-dark-scrollbar-thumb`]: '#3f3f46',
  [`--${CSS_VAR_PREFIX}-dark-scrollbar-thumb-hover`]: '#52525b',
};

/** Shared non-color variables (radius, spacing, transitions, z-index) */
const SHARED_VARS: Record<string, string> = {
  /** Border Radius */
  '--flux-radius-none': '0',
  '--flux-radius-xs': '4px',
  '--flux-radius-sm': '6px',
  '--flux-radius-md': '8px',
  '--flux-radius-lg': '12px',
  '--flux-radius-xl': '16px',
  '--flux-radius-2xl': '24px',
  '--flux-radius-full': '9999px',

  /** Spacing */
  '--flux-space-1': '0.25rem',
  '--flux-space-2': '0.5rem',
  '--flux-space-3': '0.75rem',
  '--flux-space-4': '1rem',
  '--flux-space-5': '1.25rem',
  '--flux-space-6': '1.5rem',
  '--flux-space-8': '2rem',
  '--flux-space-10': '2.5rem',
  '--flux-space-12': '3rem',
  '--flux-space-16': '4rem',

  /** Transitions */
  '--flux-transition-fast': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  '--flux-transition-base': '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  '--flux-transition-slow': '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  '--flux-transition-spring': '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',

  /** Z-Index */
  '--flux-z-dropdown': '100',
  '--flux-z-sticky': '200',
  '--flux-z-modal': '300',
  '--flux-z-popover': '400',
  '--flux-z-tooltip': '500',

  /** Backdrop */
  '--flux-backdrop-blur': 'blur(12px)',
  '--flux-backdrop-saturate': 'saturate(180%)',
};

/**
 * Apply CSS variables to the document root
 * This function completely replaces all theme variables to prevent bleeding
 */
/** Backward compatibility aliases - old var names for existing components */
const BACKWARD_COMPAT_ALIASES: Record<string, Record<string, string>> = {
  light: {
    '--background': '#fafafa',
    '--background-subtle': '#f4f4f5',
    '--surface': '#ffffff',
    '--surface-elevated': '#ffffff',
    '--foreground': '#18181b',
    '--foreground-muted': '#52525b',
    '--text-primary': '#18181b',
    '--text-secondary': '#71717a',
    '--text-tertiary': '#a1a1aa',
    '--text-inverse': '#ffffff',
    '--border-subtle': '#e4e4e7',
    '--border-default': '#d4d4d8',
    '--border-strong': '#a1a1aa',
    '--brand-primary': '#6366f1',
    '--brand-primary-hover': '#4f46e5',
    '--brand-primary-active': '#4338ca',
    '--brand-secondary': '#8b5cf6',
    '--brand-accent': '#f472b6',
    // Semantic colors
    '--success-bg': '#f0fdf4',
    '--success-bg-subtle': '#dcfce7',
    '--success-border': '#86efac',
    '--success-text': '#166534',
    '--success-text-strong': '#15803d',
    '--success-primary': '#22c55e',
    '--warning-bg': '#fffbeb',
    '--warning-bg-subtle': '#fef3c7',
    '--warning-border': '#fcd34d',
    '--warning-text': '#92400e',
    '--warning-text-strong': '#b45309',
    '--warning-primary': '#f59e0b',
    '--error-bg': '#fef2f2',
    '--error-bg-subtle': '#fee2e2',
    '--error-border': '#fca5a5',
    '--error-text': '#991b1b',
    '--error-text-strong': '#b91c1c',
    '--error-primary': '#ef4444',
    '--info-bg': '#eff6ff',
    '--info-bg-subtle': '#dbeafe',
    '--info-border': '#93c5fd',
    '--info-text': '#1e40af',
    '--info-text-strong': '#1d4ed8',
    '--info-primary': '#3b82f6',
    '--priority-high': '#ef4444',
    '--priority-medium': '#f59e0b',
    '--priority-low': '#3b82f6',
  },
  dark: {
    '--background': '#09090b',
    '--background-subtle': '#18181b',
    '--surface': '#18181b',
    '--surface-elevated': '#27272a',
    '--foreground': '#fafafa',
    '--foreground-muted': '#a1a1aa',
    '--text-primary': '#fafafa',
    '--text-secondary': '#a1a1aa',
    '--text-tertiary': '#71717a',
    '--text-inverse': '#18181b',
    '--border-subtle': '#27272a',
    '--border-default': '#3f3f46',
    '--border-strong': '#52525b',
    '--brand-primary': '#818cf8',
    '--brand-primary-hover': '#6366f1',
    '--brand-primary-active': '#4f46e5',
    '--brand-secondary': '#a78bfa',
    '--brand-accent': '#f472b6',
    // Semantic colors (dark variants)
    '--success-bg': '#052e16',
    '--success-bg-subtle': '#14532d',
    '--success-border': '#22c55e',
    '--success-text': '#86efac',
    '--success-text-strong': '#4ade80',
    '--success-primary': '#22c55e',
    '--warning-bg': '#451a03',
    '--warning-bg-subtle': '#78350f',
    '--warning-border': '#d97706',
    '--warning-text': '#fde047',
    '--warning-text-strong': '#fbbf24',
    '--warning-primary': '#f59e0b',
    '--error-bg': '#450a0a',
    '--error-bg-subtle': '#7f1d1d',
    '--error-border': '#dc2626',
    '--error-text': '#fca5a5',
    '--error-text-strong': '#f87171',
    '--error-primary': '#ef4444',
    '--info-bg': '#172554',
    '--info-bg-subtle': '#1e3a8a',
    '--info-border': '#2563eb',
    '--info-text': '#93c5fd',
    '--info-text-strong': '#60a5fa',
    '--info-primary': '#3b82f6',
    '--priority-high': '#f87171',
    '--priority-medium': '#fbbf24',
    '--priority-low': '#60a5fa',
  },
};

function applyThemeVars(theme: Theme): void {
  const root = document.documentElement;

  // Clear ALL existing flux theme variables first
  const allVars = [
    ...Object.keys(LIGHT_THEME_VARS),
    ...Object.keys(DARK_THEME_VARS),
    ...Object.keys(SHARED_VARS),
    ...Object.keys(BACKWARD_COMPAT_ALIASES.light),
    ...Object.keys(BACKWARD_COMPAT_ALIASES.dark),
  ];
  allVars.forEach((varName) => {
    root.style.removeProperty(varName);
  });

  // Apply shared variables (same for both themes)
  Object.entries(SHARED_VARS).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  // Apply theme-specific variables (light mode only)
  Object.entries(LIGHT_THEME_VARS).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  // Apply backward compatibility aliases (light mode only)
  Object.entries(BACKWARD_COMPAT_ALIASES.light).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  // Set the current theme attribute for CSS selectors
  root.setAttribute('data-flux-theme', theme);

  // Always remove dark class since dark mode is disabled
  root.classList.remove('flux-dark');
}

/**
 * ThemeProvider component - provides theme context and manages theme switching
 * Note: Dark mode is disabled - light mode is always enforced
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize theme on mount - always use light mode
  useEffect(() => {
    setMounted(true);

    // Always enforce light mode - dark mode disabled
    const initialTheme: Theme = 'light';

    setThemeState(initialTheme);
    applyThemeVars(initialTheme);
  }, []);

  /**
   * Set theme with proper transition handling
   * Note: Dark mode is disabled - always uses light mode
   * This function is kept for API compatibility but will always use light
   */
  const setTheme = useCallback((newTheme: Theme) => {
    // Always enforce light mode - dark mode disabled
    const enforcedTheme: Theme = 'light';

    // Prevent redundant updates
    if (theme === enforcedTheme) return;

    // Start transition state
    setIsTransitioning(true);

    // Immediately apply light theme (instant switch)
    applyThemeVars(enforcedTheme);

    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, enforcedTheme);

    // Update state
    setThemeState(enforcedTheme);

    // End transition state after a brief delay for animations
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    });
  }, [theme]);

  /**
   * Toggle between light and dark themes
   * Note: Dark mode is disabled - this is a no-op
   */
  const toggleTheme = useCallback(() => {
    // Dark mode disabled - no toggle allowed
    console.warn('Dark mode is disabled. Light mode is enforced.');
  }, []);

  // Always create context value - useMemo must be called unconditionally
  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isTransitioning,
      isDarkModeAvailable: false, // Dark mode disabled
    }),
    [theme, toggleTheme, setTheme, isTransitioning]
  );

  // Prevent flash of wrong theme (FOUC) during SSR
  // Use hydration boundary instead of conditional rendering
  if (!mounted) {
    // Still render provider but with default values during SSR
    return (
      <ThemeContext.Provider value={{
        theme: 'light',
        toggleTheme: () => {},
        setTheme: () => {},
        isTransitioning: false,
        isDarkModeAvailable: false,
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Returns default values if context is not available (SSR safety)
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    return {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
      isTransitioning: false,
      isDarkModeAvailable: false,
    };
  }

  return context;
}

/**
 * Helper function to get theme-scoped CSS variable
 * Use this in components to get the correct variable for current theme
 */
export function getThemeVar(name: string): string {
  // This will be resolved at runtime based on the data-flux-theme attribute
  return `var(--flux-${name})`;
}

/**
 * Generate theme-aware CSS class suffix
 * Usage: themeClass('bg', 'surface') => 'bg-flux-light-surface'
 */
export function themeClass(prefix: string, suffix: string): string {
  return `${prefix}-flux-{theme}-${suffix}`;
}
