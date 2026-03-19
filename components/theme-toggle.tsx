'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeToggle - Accessible theme switcher component
 *
 * Features:
 * - Smooth icon transition animation
 * - Keyboard accessible (Enter/Space to toggle)
 * - Respects system preference on first visit
 * - Persists preference to localStorage
 * - ARIA compliant
 * - Prevents hydration mismatch
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, isTransitioning } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-10 h-10 rounded-xl bg-[var(--background-subtle)] ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`
        relative p-2.5 rounded-xl
        bg-[var(--background-subtle)]
        border border-[var(--border-subtle)]
        shadow-sm hover:shadow-md
        transition-all duration-200
        hover:bg-[var(--border-subtle)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span className="relative z-10 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <MoonIcon className="w-5 h-5 text-[var(--brand-primary)]" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <SunIcon className="w-5 h-5 text-[var(--flux-warning-primary)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </span>

      {/* Background effect */}
      <span
        className={`
          absolute inset-0 rounded-xl
          transition-opacity duration-200
          ${isDark
            ? 'bg-gradient-to-br from-[var(--background)] to-[var(--surface)] opacity-0 group-hover:opacity-100'
            : 'bg-gradient-to-br from-[var(--surface)] to-[var(--background-subtle)] opacity-0 group-hover:opacity-100'
          }
        `}
      />
    </motion.button>
  );
}
