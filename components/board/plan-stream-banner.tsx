// components/board/plan-stream-banner.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { PlanStreamState } from './use-plan-stream';

interface PlanStreamBannerProps {
  state: PlanStreamState;
  onCancel: () => void;
}

export function PlanStreamBanner({ state, onCancel }: PlanStreamBannerProps) {
  const { phase, title, sections, errorMessage } = state;
  const isActive = phase === 'streaming';
  const completed = sections.filter(s => s.status !== 'pending').length;
  const progress = sections.length > 0 ? Math.round((completed / sections.length) * 100) : 0;

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="overflow-hidden"
      >
        <div className="rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/5 to-purple-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center flex-shrink-0">
                {isActive ? (
                  <ArrowPathIcon className="w-4.5 h-4.5 text-white animate-spin" />
                ) : (
                  <SparklesIcon className="w-4.5 h-4.5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {phase === 'error'
                    ? 'Planning failed'
                    : phase === 'cancelled'
                    ? `Stopped — ${state.tasksCreated} task${state.tasksCreated !== 1 ? 's' : ''} added`
                    : `Breaking down: ${title || 'your project'}`}
                </p>
                {phase === 'error' && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                )}
              </div>
            </div>
            {isActive && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>

          {sections.length > 0 && (
            <>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Section rows */}
              <div className="mt-3 space-y-1.5">
                {sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {section.status === 'pending' && (
                      <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--brand-primary)] animate-spin flex-shrink-0" />
                    )}
                    {section.status === 'done' && (
                      <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {section.status === 'error' && (
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span
                      className={`font-medium ${
                        section.status === 'done'
                          ? 'text-[var(--foreground)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {section.name}
                    </span>
                    {section.status === 'done' && (
                      <span className="text-[var(--text-tertiary)]">
                        {section.taskCount} task{section.taskCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {section.status === 'error' && (
                      <span className="text-amber-600 dark:text-amber-400">skipped</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
