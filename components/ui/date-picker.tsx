'use client';

import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

interface DatePickerProps {
  value?: string; // ISO string or undefined
  onChange: (iso: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string; // default "Set due date"
}

const WEEKDAY_LABELS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface LocalDateParts {
  year: number;
  month: number; // 0-indexed
  day: number;
}

/**
 * Parse an ISO string into LOCAL year/month/day for display.
 * We read the calendar-day portion ("YYYY-MM-DD") directly so the displayed
 * day never drifts due to timezone offsets when the time component is present.
 */
function parseLocalParts(iso: string | undefined): LocalDateParts | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  }
  // Fallback: parse via Date and read LOCAL components.
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
}

/** Build a leading-blank-padded month grid: null entries pad the first week. */
function buildMonthGrid(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function formatTriggerLabel(parts: LocalDateParts): string {
  // Construct at noon-local to keep the weekday correct and stable.
  const d = new Date(parts.year, parts.month, parts.day, 12, 0, 0);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Set due date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedParts = useMemo(() => parseLocalParts(value), [value]);

  // The month/year currently shown in the panel header.
  const [viewYear, setViewYear] = useState<number>(() => {
    const initial = parseLocalParts(value);
    return initial ? initial.year : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const initial = parseLocalParts(value);
    return initial ? initial.month : new Date().getMonth();
  });

  // Open the panel, syncing the visible month to the selected value (or today).
  const openPanel = () => {
    const target = parseLocalParts(value) ?? {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    };
    setViewYear(target.year);
    setViewMonth(target.month);
    setIsOpen(true);
  };

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    setViewMonth((prevMonth) => {
      if (prevMonth === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prevMonth - 1;
    });
  };

  const goToNextMonth = () => {
    setViewMonth((prevMonth) => {
      if (prevMonth === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prevMonth + 1;
    });
  };

  const emitDay = (year: number, month: number, day: number) => {
    // Emit NOON-LOCAL ISO to avoid UTC-midnight day-rollback bugs.
    const d = new Date(year, month, day, 12, 0, 0);
    onChange(d.toISOString());
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    emitDay(today.year, today.month, today.day);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      openPanel();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPanel();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--background-subtle)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CalendarIcon className="w-4 h-4 flex-shrink-0 text-[var(--text-secondary)]" />
        <span className={`truncate ${selectedParts ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {selectedParts ? formatTriggerLabel(selectedParts) : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{ transformOrigin: 'top left' }}
            className="absolute z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg shadow-black/20"
          >
            {/* Month header */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={goToPrevMonth}
                aria-label="Previous month"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                aria-label="Next month"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="text-center text-xs font-medium text-[var(--text-tertiary)] py-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} className="w-9 h-9" aria-hidden="true" />;
                }
                const isToday =
                  day === today.day && viewMonth === today.month && viewYear === today.year;
                const isSelected =
                  selectedParts !== null &&
                  day === selectedParts.day &&
                  viewMonth === selectedParts.month &&
                  viewYear === selectedParts.year;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => emitDay(viewYear, viewMonth, day)}
                    aria-label={formatTriggerLabel({ year: viewYear, month: viewMonth, day })}
                    aria-pressed={isSelected}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 ${
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-white font-semibold'
                        : isToday
                          ? 'text-[var(--brand-primary)] font-semibold ring-1 ring-inset ring-[var(--brand-primary)]/40 hover:bg-[var(--background-subtle)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--background-subtle)]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleSelectToday}
                className="flex-1 px-3 py-2 min-h-[36px] rounded-lg text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--background-subtle)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-3 py-2 min-h-[36px] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
