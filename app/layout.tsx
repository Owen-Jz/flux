import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWAUpdateBanner } from "@/components/pwa/update-banner";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux | Modern Project Management",
  description: "A cutting-edge project management SaaS with real-time collaboration.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/icon.svg" },
  },
  openGraph: {
    title: "Flux | Modern Project Management",
    description: "A cutting-edge project management SaaS with real-time collaboration.",
    type: "website",
    images: ["/icon.svg"],
  },
  twitter: {
    card: "summary",
    title: "Flux | Modern Project Management",
    description: "A cutting-edge project management SaaS with real-time collaboration.",
    images: ["/icon.svg"],
  },
};

/**
 * Inline script to detect theme preference and prevent flash of wrong theme (FOUC)
 * - Checks localStorage for saved preference
 * - Falls back to system preference on first visit
 * - Applies theme before React hydrates for instant theme display
 */
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Check localStorage for saved preference
              var stored = localStorage.getItem('flux-theme');

              // Determine theme: stored preference > default light
              var theme;
              if (stored === 'light' || stored === 'dark') {
                theme = stored;
              } else {
                // Default to light mode (not system preference)
                theme = 'light';
              }

              // Apply theme attribute immediately
              document.documentElement.setAttribute('data-flux-theme', theme);

              if (theme === 'dark') {
                document.documentElement.classList.add('flux-dark');
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('flux-dark');
                document.documentElement.classList.remove('dark');
              }

              var root = document.documentElement;

              // Common variables (same for both themes)
              var sharedVars = {
                '--flux-radius-none': '0',
                '--flux-radius-xs': '4px',
                '--flux-radius-sm': '6px',
                '--flux-radius-md': '8px',
                '--flux-radius-lg': '12px',
                '--flux-radius-xl': '16px',
                '--flux-radius-2xl': '24px',
                '--flux-radius-full': '9999px',
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
                '--flux-transition-fast': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '--flux-transition-base': '200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '--flux-transition-slow': '300ms cubic-bezier(0.4, 0, 0.2, 1)',
                '--flux-transition-spring': '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                '--flux-z-dropdown': '100',
                '--flux-z-sticky': '200',
                '--flux-z-modal': '300',
                '--flux-z-popover': '400',
                '--flux-z-tooltip': '500',
                '--flux-backdrop-blur': 'blur(12px)',
                '--flux-backdrop-saturate': 'saturate(180%)'
              };

              // Light theme variables (purple brand)
              var lightVars = {
                '--flux-light-brand-primary': '#7c3aed',
                '--flux-light-brand-primary-hover': '#6d28d9',
                '--flux-light-brand-primary-active': '#5b21b6',
                '--flux-light-brand-secondary': '#8b5cf6',
                '--flux-light-brand-accent': '#d946ef',
                '--flux-light-bg': '#fafafa',
                '--flux-light-bg-subtle': '#f4f4f5',
                '--flux-light-surface': '#ffffff',
                '--flux-light-surface-elevated': '#ffffff',
                '--flux-light-fg': '#18181b',
                '--flux-light-fg-muted': '#52525b',
                '--flux-light-text-primary': '#18181b',
                '--flux-light-text-secondary': '#52525b',
                '--flux-light-text-tertiary': '#71717a',
                '--flux-light-text-inverse': '#ffffff',
                '--flux-light-border-subtle': '#e4e4e7',
                '--flux-light-border-default': '#d4d4d8',
                '--flux-light-border-strong': '#a1a1aa',
                '--skeleton-light-highlight': '#f0f0f0',
                '--flux-light-success-bg': '#f0fdf4',
                '--flux-light-success-bg-subtle': '#dcfce7',
                '--flux-light-success-border': '#86efac',
                '--flux-light-success-text': '#166534',
                '--flux-light-success-text-strong': '#15803d',
                '--flux-light-success-primary': '#22c55e',
                '--flux-light-warning-bg': '#fffbeb',
                '--flux-light-warning-bg-subtle': '#fef3c7',
                '--flux-light-warning-border': '#fcd34d',
                '--flux-light-warning-text': '#92400e',
                '--flux-light-warning-text-strong': '#b45309',
                '--flux-light-warning-primary': '#f59e0b',
                '--flux-light-error-bg': '#fef2f2',
                '--flux-light-error-bg-subtle': '#fee2e2',
                '--flux-light-error-border': '#fca5a5',
                '--flux-light-error-text': '#991b1b',
                '--flux-light-error-text-strong': '#b91c1c',
                '--flux-light-error-primary': '#ef4444',
                '--flux-light-info-bg': '#eff6ff',
                '--flux-light-info-bg-subtle': '#dbeafe',
                '--flux-light-info-border': '#93c5fd',
                '--flux-light-info-text': '#1e40af',
                '--flux-light-info-text-strong': '#1d4ed8',
                '--flux-light-info-primary': '#3b82f6',
                '--flux-light-priority-high': '#ef4444',
                '--flux-light-priority-medium': '#f59e0b',
                '--flux-light-priority-low': '#3b82f6',
                '--flux-light-shadow-xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                '--flux-light-shadow-sm': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                '--flux-light-shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
                '--flux-light-shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
                '--flux-light-shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                '--flux-light-shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                '--flux-light-focus-ring': '0 0 0 3px rgba(124, 58, 237, 0.4)',
                '--flux-light-focus-ring-success': '0 0 0 3px rgba(34, 197, 94, 0.4)',
                '--flux-light-focus-ring-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
                '--flux-light-glass-bg': 'rgba(255, 255, 255, 0.7)',
                '--flux-light-glass-border': 'rgba(255, 255, 255, 0.3)',
                '--flux-light-scrollbar-track': '#f4f4f5',
                '--flux-light-scrollbar-thumb': '#d4d4d8',
                '--flux-light-scrollbar-thumb-hover': '#a1a1aa'
              };

              // Dark theme variables (purple brand)
              var darkVars = {
                '--flux-dark-brand-primary': '#a78bfa',
                '--flux-dark-brand-primary-hover': '#8b5cf6',
                '--flux-dark-brand-primary-active': '#7c3aed',
                '--flux-dark-brand-secondary': '#c4b5fd',
                '--flux-dark-brand-accent': '#f0abfc',
                '--flux-dark-bg': '#09090b',
                '--flux-dark-bg-subtle': '#18181b',
                '--flux-dark-surface': '#18181b',
                '--flux-dark-surface-elevated': '#27272a',
                '--flux-dark-fg': '#fafafa',
                '--flux-dark-fg-muted': '#a1a1aa',
                '--flux-dark-text-primary': '#fafafa',
                '--flux-dark-text-secondary': '#a1a1aa',
                '--flux-dark-text-tertiary': '#71717a',
                '--flux-dark-text-inverse': '#18181b',
                '--flux-dark-border-subtle': '#27272a',
                '--flux-dark-border-default': '#3f3f46',
                '--flux-dark-border-strong': '#52525b',
                '--skeleton-dark-highlight': '#1f1f23',
                '--flux-dark-success-bg': '#052e16',
                '--flux-dark-success-bg-subtle': '#14532d',
                '--flux-dark-success-border': '#22c55e',
                '--flux-dark-success-text': '#86efac',
                '--flux-dark-success-text-strong': '#4ade80',
                '--flux-dark-success-primary': '#22c55e',
                '--flux-dark-warning-bg': '#451a03',
                '--flux-dark-warning-bg-subtle': '#78350f',
                '--flux-dark-warning-border': '#d97706',
                '--flux-dark-warning-text': '#fde047',
                '--flux-dark-warning-text-strong': '#fbbf24',
                '--flux-dark-warning-primary': '#f59e0b',
                '--flux-dark-error-bg': '#450a0a',
                '--flux-dark-error-bg-subtle': '#7f1d1d',
                '--flux-dark-error-border': '#dc2626',
                '--flux-dark-error-text': '#fca5a5',
                '--flux-dark-error-text-strong': '#f87171',
                '--flux-dark-error-primary': '#ef4444',
                '--flux-dark-info-bg': '#172554',
                '--flux-dark-info-bg-subtle': '#1e3a8a',
                '--flux-dark-info-border': '#2563eb',
                '--flux-dark-info-text': '#93c5fd',
                '--flux-dark-info-text-strong': '#60a5fa',
                '--flux-dark-info-primary': '#3b82f6',
                '--flux-dark-priority-high': '#f87171',
                '--flux-dark-priority-medium': '#fbbf24',
                '--flux-dark-priority-low': '#60a5fa',
                '--flux-dark-shadow-xs': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
                '--flux-dark-shadow-sm': '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
                '--flux-dark-shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
                '--flux-dark-shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
                '--flux-dark-shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)',
                '--flux-dark-shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.8)',
                '--flux-dark-focus-ring': '0 0 0 3px rgba(167, 139, 250, 0.5)',
                '--flux-dark-focus-ring-success': '0 0 0 3px rgba(34, 197, 94, 0.5)',
                '--flux-dark-focus-ring-error': '0 0 0 3px rgba(239, 68, 68, 0.5)',
                '--flux-dark-glass-bg': 'rgba(24, 24, 27, 0.8)',
                '--flux-dark-glass-border': 'rgba(255, 255, 255, 0.1)',
                '--flux-dark-scrollbar-track': '#18181b',
                '--flux-dark-scrollbar-thumb': '#3f3f46',
                '--flux-dark-scrollbar-thumb-hover': '#52525b'
              };

              // Apply shared vars
              Object.keys(sharedVars).forEach(function(key) {
                root.style.setProperty(key, sharedVars[key]);
              });

              // Apply theme-specific vars
              var themeVars = theme === 'dark' ? darkVars : lightVars;
              Object.keys(themeVars).forEach(function(key) {
                root.style.setProperty(key, themeVars[key]);
              });

              // Apply backward compatibility aliases
              var aliases = theme === 'dark' ? {
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
                '--brand-primary': '#a78bfa',
                '--brand-primary-hover': '#8b5cf6',
                '--brand-primary-active': '#7c3aed',
                '--brand-secondary': '#c4b5fd',
                '--brand-accent': '#f0abfc',
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
                '--priority-low': '#60a5fa'
              } : {
                '--background': '#fafafa',
                '--background-subtle': '#f4f4f5',
                '--surface': '#ffffff',
                '--surface-elevated': '#ffffff',
                '--foreground': '#18181b',
                '--foreground-muted': '#52525b',
                '--text-primary': '#18181b',
                '--text-secondary': '#52525b',
                '--text-tertiary': '#71717a',
                '--text-inverse': '#ffffff',
                '--border-subtle': '#e4e4e7',
                '--border-default': '#d4d4d8',
                '--border-strong': '#a1a1aa',
                '--brand-primary': '#7c3aed',
                '--brand-primary-hover': '#6d28d9',
                '--brand-primary-active': '#5b21b6',
                '--brand-secondary': '#8b5cf6',
                '--brand-accent': '#d946ef',
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
                '--priority-low': '#3b82f6'
              };

              Object.keys(aliases).forEach(function(key) {
                root.style.setProperty(key, aliases[key]);
              });
            } catch (e) {
              console.warn('Theme initialization failed:', e);
            }
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <PWAUpdateBanner />
      </body>
    </html>
  );
}
