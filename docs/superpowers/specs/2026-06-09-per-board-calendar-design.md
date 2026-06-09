# Per-Board Calendar — Design Spec

**Date:** 2026-06-09
**Status:** Approved, implementing

## Goal

Give every board its own calendar, fully isolated from the workspace calendar and
from other boards' calendars. Primary use case: a "Social Media" board where each
post is a task scheduled on a date. Planning/visualization only — no auto-publishing.

## Decisions (locked with user)

1. **Plan & visualize only** — no integration with social platforms, no publishing queue.
2. **Isolated** — items scheduled on a board calendar do NOT appear on the workspace
   calendar, and each board's calendar is independent.
3. **A scheduled item is a real Task** — it lives in the board's kanban and on the
   board calendar. You get assignees/status/comments/etc. for free.

## Mechanism

Isolation is achieved with a dedicated date field, not a separate system:

- New optional `Task.scheduledDate` alongside the existing `Task.dueDate`.
- **Workspace calendar** keeps reading `dueDate` only → never sees board-scheduled items.
- **Board calendar** reads `scheduledDate`, scoped to one `boardId` → independent per board.
- A task may have both dates; neither leaks into the other's view.

This reuses the existing calendar UI (one codebase) rather than building a second one.

## Changes

### `models/Task.ts`
- Add `scheduledDate?: Date` to `ITask` and schema.
- Add index `{ boardId: 1, scheduledDate: 1 }`.
- Purely additive — no migration.

### `actions/task.ts`
- `CalendarTask`: `dueDate` becomes optional; add optional `scheduledDate`.
- `updateTask`: accept `scheduledDate?: string | null`, persist it.
- New `getBoardCalendarTasks(workspaceSlug, boardSlug)` — same auth/visibility as
  `getCalendarTasks`, scoped to one board, filtering on `scheduledDate`.
- New `updateTaskScheduledDate(taskId, date, workspaceSlug)` — mirror of
  `updateTaskDueDate`, writes `scheduledDate`, revalidates the board path.
- `getCalendarTasks` (workspace) — UNCHANGED (guarantees isolation).

### `components/calendar/CalendarGrid.tsx`
- Add `dateField?: 'dueDate' | 'scheduledDate'` (default `'dueDate'`); position tasks
  by `task[dateField]` with an undefined guard.

### `components/calendar/CalendarClient.tsx`
- Add `dateField?: 'dueDate' | 'scheduledDate'` (default `'dueDate'`). Used for the
  persist call (drag + create), optimistic writes, and empty-state copy. Defaults keep
  the workspace calendar's behavior identical.

### `app/[slug]/board/[boardSlug]/page.tsx`
- Read `?view=` from `searchParams`. Default = kanban (unchanged). `view=calendar`
  renders `CalendarClient` with `dateField="scheduledDate"`, `boards={[thisBoard]}`.
- Add a compact `Kanban | Calendar` tab toggle (URL-driven `<Link>`s, refresh-safe).

## Out of scope (YAGNI)
- Auto-publishing / platform OAuth / scheduling queue.
- Board "types" — every board gets the calendar view.
- Recurring posts, separate "post" entity.

## Verification gates
`npx tsc --noEmit` → `npm run lint` → `npm run build`, all green.
