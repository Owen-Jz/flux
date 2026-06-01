// components/board/plan-complete-modal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const COLUMN_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
};

interface PlanCompleteModalProps {
  isOpen: boolean;
  tasksCreated: number;
  columnTotals: Record<string, number>;
  onUndo: () => Promise<void>;
  onKeep: () => void;
  /** True when the plan was stopped early by the user (affects copy only). */
  cancelled?: boolean;
}

export function PlanCompleteModal({
  isOpen,
  tasksCreated,
  columnTotals,
  onUndo,
  onKeep,
  cancelled = false,
}: PlanCompleteModalProps) {
  const [isUndoing, setIsUndoing] = useState(false);
  const columnCount = Object.keys(columnTotals).length;

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={isUndoing ? undefined : onKeep}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 sm:inset-0 sm:m-auto w-auto sm:max-w-md h-fit bg-[var(--surface)] rounded-2xl shadow-2xl z-50 border border-[var(--border-subtle)] p-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {cancelled ? 'Plan stopped' : tasksCreated > 0 ? 'Plan complete!' : 'Nothing was added'}
                </h2>
                {tasksCreated > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Added <span className="font-semibold text-[var(--foreground)]">{tasksCreated}</span>{' '}
                    task{tasksCreated !== 1 ? 's' : ''} across {columnCount} column{columnCount !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {tasksCreated > 0 && (
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {Object.entries(columnTotals).map(([status, count]) => (
                    <span
                      key={status}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      {COLUMN_LABELS[status] ?? status}: {count}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pt-2">
                {tasksCreated > 0 && (
                  <button
                    onClick={handleUndo}
                    disabled={isUndoing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--background-subtle)] disabled:opacity-50 transition-colors"
                  >
                    {isUndoing ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUturnLeftIcon className="w-4 h-4" />
                    )}
                    {isUndoing ? 'Undoing…' : 'Undo all'}
                  </button>
                )}
                <button
                  onClick={onKeep}
                  disabled={isUndoing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {tasksCreated > 0 ? 'Keep' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
