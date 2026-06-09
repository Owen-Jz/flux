// components/board/plan-stream-banner.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { PlanStreamState, SectionStatus } from './use-plan-stream';

// Shared motion language for the AI experience — calm, intentional, consistent.
const EASE = [0.22, 1, 0.36, 1] as const;

interface PlanStreamBannerProps {
  state: PlanStreamState;
  onCancel: () => void;
  onDismiss: () => void;
  /** Domain-aware phrases cycled while waiting for the first sections to arrive. */
  loadingMessages?: string[];
}

function SectionStatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="flex-shrink-0"
      >
        <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
      </motion.span>
    );
  }
  if (status === 'error') {
    return <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
  }
  // pending — a calm pulsing dot rather than yet another spinner
  return (
    <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
    </span>
  );
}

export function PlanStreamBanner({ state, onCancel, onDismiss, loadingMessages }: PlanStreamBannerProps) {
  const { phase, title, sections, errorMessage, tasksCreated, upgradeRequired } = state;
  const isActive = phase === 'streaming';
  const analyzing = isActive && sections.length === 0;
  const completed = sections.filter((s) => s.status !== 'pending').length;
  const progress = sections.length > 0 ? Math.round((completed / sections.length) * 100) : 0;

  // Rotate domain-aware phrases while we wait for the first sections to arrive.
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    if (!analyzing) return;
    const id = setInterval(() => setMsgIdx((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [analyzing]);
  const messages = loadingMessages && loadingMessages.length > 0 ? loadingMessages : ['Analyzing your project'];
  const analyzingMsg = messages[msgIdx % messages.length];

  return (
    // Conditionally rendering the child (not early-returning null) lets the
    // collapse-out exit animation actually play when the stream finishes.
    <AnimatePresence initial={false}>
      {phase !== 'idle' && (
        <motion.div
          key="plan-stream-banner"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/8 to-purple-500/8 p-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center flex-shrink-0">
                  {isActive && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg bg-[var(--brand-primary)]"
                      animate={{ opacity: [0.45, 0], scale: [1, 1.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <SparklesIcon className="relative w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {phase === 'error'
                      ? 'Planning failed'
                      : phase === 'cancelled'
                        ? `Stopped — ${tasksCreated} task${tasksCreated !== 1 ? 's' : ''} added`
                        : analyzing
                          ? (
                              <AnimatePresence mode="wait">
                                  <motion.span
                                      key={analyzingMsg}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      transition={{ duration: 0.25 }}
                                      className="inline-block"
                                  >
                                      {analyzingMsg}…
                                  </motion.span>
                              </AnimatePresence>
                            )
                          : `Building: ${title || 'your project'}`}
                  </p>
                  {phase === 'error' && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                  )}
                  {phase === 'error' && upgradeRequired && (
                    <Link
                      href="/pricing"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 transition-all"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      Upgrade plan
                    </Link>
                  )}
                  {isActive && !analyzing && (
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {completed} of {sections.length} section{sections.length !== 1 ? 's' : ''} planned
                    </p>
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
              {(phase === 'error' || phase === 'cancelled') && (
                <button
                  onClick={onDismiss}
                  aria-label="Dismiss"
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress bar — indeterminate while analyzing, determinate once sections exist */}
            {isActive && (
              <div className="relative mt-3 h-1.5 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                {analyzing ? (
                  <motion.div
                    className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent"
                    animate={{ x: ['-120%', '320%'] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : (
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                )}
              </div>
            )}

            {/* Section rows */}
            {(analyzing || sections.length > 0) && (
              <div className="mt-3 space-y-1.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {analyzing
                    ? [0, 1, 2].map((i) => (
                        <motion.div
                          key={`skeleton-${i}`}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="flex items-center gap-2"
                        >
                          <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-[var(--background-subtle)] animate-pulse" />
                          </span>
                          <span
                            className="h-2.5 rounded animate-shimmer"
                            style={{ width: `${52 - i * 9}%` }}
                          />
                        </motion.div>
                      ))
                    : sections.map((section, i) => (
                        <motion.div
                          key={`${section.name}-${i}`}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <SectionStatusIcon status={section.status} />
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
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.25 }}
                              className="text-[var(--text-tertiary)]"
                            >
                              {section.taskCount} task{section.taskCount !== 1 ? 's' : ''}
                            </motion.span>
                          )}
                          {section.status === 'error' && (
                            <span className="text-amber-600 dark:text-amber-400">skipped</span>
                          )}
                        </motion.div>
                      ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
