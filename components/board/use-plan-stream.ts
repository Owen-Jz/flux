// components/board/use-plan-stream.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardStreamRequest, PlanStreamEvent, StreamedTask } from '@/types/ai-plan';

export type SectionStatus = 'pending' | 'done' | 'error';

export interface BannerSection {
  name: string;
  description: string;
  status: SectionStatus;
  taskCount: number;
}

export type PlanStreamPhase = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled';

export interface PlanStreamState {
  phase: PlanStreamPhase;
  title: string;
  summary: string;
  sections: BannerSection[];
  tasksCreated: number;
  columnTotals: Record<string, number>;
  createdTaskIds: string[];
  errorMessage: string;
  upgradeRequired: boolean;
}

const INITIAL_STATE: PlanStreamState = {
  phase: 'idle',
  title: '',
  summary: '',
  sections: [],
  tasksCreated: 0,
  columnTotals: {},
  createdTaskIds: [],
  errorMessage: '',
  upgradeRequired: false,
};

interface UsePlanStreamCallbacks {
  onTasks: (tasks: StreamedTask[]) => void;
}

export function usePlanStream({ onTasks }: UsePlanStreamCallbacks) {
  const [state, setState] = useState<PlanStreamState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the consuming component unmounts, so
  // navigating away mid-stream does not leak the fetch reader or fire
  // setState on an unmounted component.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(prev => (prev.phase === 'streaming' ? { ...prev, phase: 'cancelled' } : prev));
  }, []);

  const handleEvent = useCallback(
    (event: PlanStreamEvent) => {
      switch (event.type) {
        case 'skeleton':
          setState(prev => ({
            ...prev,
            phase: 'streaming',
            title: event.title,
            summary: event.summary,
            sections: event.sections.map(s => ({
              name: s.name,
              description: s.description,
              status: 'pending' as SectionStatus,
              taskCount: 0,
            })),
          }));
          break;
        case 'section': {
          onTasks(event.tasks);
          const ids = event.tasks.map(t => t.id);
          setState(prev => {
            const sections = prev.sections.map((s, i) =>
              i === event.sectionIndex
                ? { ...s, status: 'done' as SectionStatus, taskCount: event.tasks.length }
                : s
            );
            // Accumulate live totals so the banner/modal have data even if the
            // user cancels before the final `done` event arrives.
            const columnTotals = { ...prev.columnTotals };
            for (const t of event.tasks) {
              columnTotals[t.status] = (columnTotals[t.status] ?? 0) + 1;
            }
            return {
              ...prev,
              sections,
              createdTaskIds: [...prev.createdTaskIds, ...ids],
              tasksCreated: prev.tasksCreated + ids.length,
              columnTotals,
            };
          });
          break;
        }
        case 'section_error':
          setState(prev => {
            const sections = prev.sections.map((s, i) =>
              i === event.sectionIndex ? { ...s, status: 'error' as SectionStatus } : s
            );
            return { ...prev, sections };
          });
          break;
        case 'done':
          // Reconcile with the server's authoritative totals (equal to what we
          // accumulated from `section` events, but trust the final word).
          setState(prev => ({
            ...prev,
            phase: prev.phase === 'cancelled' ? 'cancelled' : 'done',
            tasksCreated: event.tasksCreated,
            columnTotals: event.columnTotals,
            createdTaskIds: event.taskIds,
          }));
          break;
        case 'error':
          setState(prev => ({ ...prev, phase: 'error', errorMessage: event.message }));
          break;
      }
    },
    [onTasks]
  );

  const start = useCallback(
    async (req: BoardStreamRequest) => {
      // Double-submit guard: abort any stream already in flight so we never
      // run two concurrent streams writing to the same board (which would
      // orphan the first run's task IDs and make Undo unable to remove them).
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ ...INITIAL_STATE, phase: 'streaming' });

      try {
        const res = await fetch('/api/ai/plan/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let message = 'Planning failed — please try again';
          let upgradeRequired = res.status === 402;
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
            if (data?.upgradeRequired === true) upgradeRequired = true;
          } catch {
            /* non-JSON error body; keep default */
          }
          setState(prev => ({ ...prev, phase: 'error', errorMessage: message, upgradeRequired }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // SSE frames are separated by a blank line. Each frame has `event:` and `data:` lines.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);

            const dataLine = frame
              .split('\n')
              .find(line => line.startsWith('data:'));
            if (!dataLine) continue;

            const json = dataLine.slice('data:'.length).trim();
            if (!json) continue;
            try {
              handleEvent(JSON.parse(json) as PlanStreamEvent);
            } catch {
              /* ignore malformed frame */
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // user cancelled — state already set by cancel()
          return;
        }
        const message = err instanceof Error ? err.message : 'Connection lost';
        setState(prev => ({ ...prev, phase: 'error', errorMessage: message }));
      } finally {
        controllerRef.current = null;
      }
    },
    [handleEvent]
  );

  return { state, start, cancel, reset };
}
