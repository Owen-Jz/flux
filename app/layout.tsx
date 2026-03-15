import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux | Modern Project Management",
  description: "A cutting-edge project management SaaS with real-time collaboration.",
};

/**
 * Inline script to enforce light mode and prevent flash of wrong theme (FOUC)
 * This runs before React hydrates, ensuring instant theme application
 * Light mode is enforced for optimal conversion rates
 */
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Enforce light mode only - dark mode disabled
              var theme = 'light';

              // Apply theme immediately to prevent flash
              document.documentElement.setAttribute('data-flux-theme', theme);

              // Set CSS variables before render
              var root = document.documentElement;

              // Light theme variables only
              var lightVars = {
                '--flux-light-brand-primary': '#6366f1',
                '--flux-light-brand-primary-hover': '#4f46e5',
                '--flux-light-brand-primary-active': '#4338ca',
                '--flux-light-brand-secondary': '#8b5cf6',
                '--flux-light-brand-accent': '#f472b6',
                '--flux-light-bg': '#fafafa',
                '--flux-light-bg-subtle': '#f4f4f5',
                '--flux-light-surface': '#ffffff',
                '--flux-light-surface-elevated': '#ffffff',
                '--flux-light-fg': '#18181b',
                '--flux-light-fg-muted': '#52525b',
                '--flux-light-text-primary': '#18181b',
                '--flux-light-text-secondary': '#71717a',
                '--flux-light-text-tertiary': '#a1a1aa',
                '--flux-light-text-inverse': '#ffffff',
                '--flux-light-border-subtle': '#e4e4e7',
                '--flux-light-border-default': '#d4d4d8',
                '--flux-light-border-strong': '#a1a1aa',
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
                '--flux-light-focus-ring': '0 0 0 3px rgba(99, 102, 241, 0.4)',
                '--flux-light-focus-ring-success': '0 0 0 3px rgba(34, 197, 94, 0.4)',
                '--flux-light-focus-ring-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
                '--flux-light-glass-bg': 'rgba(255, 255, 255, 0.7)',
                '--flux-light-glass-border': 'rgba(255, 255, 255, 0.3)',
                '--flux-light-scrollbar-track': '#f4f4f5',
                '--flux-light-scrollbar-thumb': '#d4d4d8',
                '--flux-light-scrollbar-thumb-hover': '#a1a1aa'
              };

              // Shared variables (light mode only)
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

              // Apply shared vars
              Object.keys(sharedVars).forEach(function(key) {
                root.style.setProperty(key, sharedVars[key]);
              });

              // Apply light theme vars only (dark mode disabled)
              Object.keys(lightVars).forEach(function(key) {
                root.style.setProperty(key, lightVars[key]);
              });

              // Apply backward compatibility aliases (light mode only)
              var aliasVars = {
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
                '--priority-low': '#3b82f6'
              };
              Object.keys(aliasVars).forEach(function(key) {
                root.style.setProperty(key, aliasVars[key]);
              });
            } catch (e) {
              // Fallback - use defaults
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
