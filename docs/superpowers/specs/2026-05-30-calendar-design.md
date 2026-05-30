# Calendar Feature Design

**Date:** 2026-05-30  
**Status:** Approved

## Overview

A month-view calendar page within each workspace that surfaces tasks by their `dueDate`. Users can drag tasks to reschedule them, click empty days to create tasks with a pre-filled due date, and click task chips to open the existing task detail modal.

## Requirements

- Month-only calendar view (no week/day views)
- Tasks placed by `dueDate` only (no date range spanning)
- Click a task → opens existing task detail modal
- Drag a task to a new day → reschedules (updates `dueDate`)
- Click an empty day → opens new task modal with that date pre-filled
- Shows all tasks across all boards in the workspace that have a due date
- VIEWER role sees read-only calendar (drag and click-to-create disabled)

## Route

`/[slug]/calendar`

## Data Layer

### New server action: `getCalendarTasks(workspaceSlug)`

Location: `actions/task.ts`

Query: `Task.find({ workspaceId, dueDate: { $exists: true, $ne: null } })`

Returns lightweight projection:
```ts
{
  id: string;
  title: string;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  boardId: string;
  boardSlug: string;
}
```

Access control: same `isWorkspaceMember` check as other task actions.

### Due date update

A thin `updateTaskDueDate(taskId: string, newDate: Date, workspaceSlug: string)` wrapper around the existing `updateTask` action. Calls `revalidatePath('/{slug}/calendar')` after mutation.

## Component Architecture

### `app/[slug]/calendar/page.tsx` (Server Component)

- Authenticates session, fetches workspace, calls `getCalendarTasks`
- Passes tasks and `userRole` to `CalendarClient`

### `components/CalendarClient.tsx` (Client Component)

- Owns `currentMonth` / `currentYear` state
- Renders month navigation header (prev arrow / "Month Year" / next arrow)
- Renders `CalendarGrid`
- Manages optimistic state updates on drag-and-drop

### `components/CalendarGrid.tsx` (Presentational)

- Accepts month, year, tasks, userRole
- Computes which tasks fall on each day
- Renders 7-column CSS Grid
- Each day cell shows up to 3 `CalendarTaskChip` components; overflow → "+N more" label
- Drop target for drag-and-drop (HTML5 `onDrop` / `onDragOver`)
- Click on empty day → triggers new task modal (disabled for VIEWER)

### `components/CalendarTaskChip.tsx` (Presentational)

- Displays task title (truncated), priority color dot, status
- Priority colors: HIGH=red, MEDIUM=yellow, LOW=gray
- `draggable` attribute enabled (disabled for VIEWER)
- `onClick` → opens existing task detail modal

## Navigation

- New `Calendar` nav item added to `sidebar.tsx` and `mobile-nav`
- Icon: `CalendarDaysIcon` from `@heroicons/react/24/outline`
- Position: between Analytics and Team
- Visible to all roles (ADMIN, EDITOR, VIEWER)

## Empty States

- No tasks with due dates in workspace: centered message — "No scheduled tasks. Set a due date on a task to see it here."
- Month with no tasks: grid renders normally, all cells empty

## No New Dependencies

Implementation uses:
- HTML5 Drag and Drop API (native browser)
- CSS Grid (existing Tailwind classes)
- Heroicons (already installed)
- Existing task detail modal component
