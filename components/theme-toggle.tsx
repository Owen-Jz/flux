'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative p-2.5 rounded-xl
        bg-surface border border-border-subtle
        shadow-sm hover:shadow-md
        transition-all duration-200
        group ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="relative z-10">
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-[var(--flux-text-secondary)] group-hover:text-[var(--flux-brand-primary)] transition-colors" />
        ) : (
          <Sun className="w-5 h-5 text-[var(--flux-text-secondary)] group-hover:text-yellow-400 transition-colors" />
        )}
      </span>

      {/* Background effect - theme isolated */}
      <span
        className={`
          absolute inset-0 rounded-xl
          transition-opacity duration-200
          ${theme === 'light'
            ? 'bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100'
            : 'bg-gradient-to-br from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100'
          }
        `}
      />
    </motion.button>
  );
}
