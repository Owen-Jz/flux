# Unread Indicator (Red Dot) Design Spec

## Context

When a user has unseen notifications (activities) or unseen comments on a workspace or board, they should see a red dot indicator. The goal is to surface "you have stuff to look at" without overwhelming with counts.

## Approach

**Mark as read on view** — When a user visits a workspace or board page, all unread activities for that context are automatically marked `read: true`. This keeps the model simple (single `read` field, no separate "seen" state).

- Red dot appears when there are unread activities (notifications + comments) that haven't been viewed yet.
- Viewing the workspace or board marks them as read, dot disappears.
- Manual "mark as read" via the notification dropdown remains functional.

## Locations

### 1. Dashboard — Workspace Cards
- Each `WorkspaceCard` in `app/dashboard/page.tsx` shows a red dot if that workspace has unread activities.
- The dot appears on the card itself, near the workspace name or in the top-right corner.

### 2. Workspace Page — Header Area
- `app/[slug]/page.tsx` shows a red dot in the workspace header when unread activities exist for that workspace.
- This is separate from the notification bell in the workspace header (which shows unread count).

### 3. Board View — Navigation Bar
- `app/[slug]/board/[boardSlug]/page.tsx` shows a red dot on the board tab/navigation when any task on that board has unread comments or notifications.
- This is scoped to the specific board, not the whole workspace.

## Data Flow

### Server Actions (additions to `actions/activity.ts`)
- `getUnreadActivityCount(workspaceSlug)` — already exists, used for dashboard dot
- `getUnreadActivityCountForBoard(workspaceSlug, boardSlug)` — new function to get board-scoped unread count
- `markAllActivitiesAsReadForBoard(workspaceSlug, boardSlug)` — new function to mark board-scoped activities as read on visit
- When visiting a workspace page, call `markAllActivitiesAsRead(workspaceSlug)` to clear the dot
- When visiting a board page, call `markAllActivitiesAsReadForBoard(workspaceSlug, boardSlug)` to clear the dot

### Dashboard Page
- `app/dashboard/page.tsx` fetches unread counts for all workspaces alongside the workspace list
- Passes `hasUnread` prop to each `WorkspaceCard`

### Workspace Card Component
- `components/dashboard/WorkspaceCard.tsx` accepts `hasUnread?: boolean` prop
- Renders red dot overlay when `hasUnread === true`

### Workspace Page
- `app/[slug]/page.tsx` calls `getUnreadActivityCount(slug)` on load
- Shows a red dot badge on the page header
- Calls `markAllActivitiesAsRead(slug)` on mount to clear

### Board Page
- `app/[slug]/board/[boardSlug]/page.tsx` calls `getUnreadActivityCountForBoard(slug, boardSlug)` on load
- Shows a red dot on the board tab/bar
- Calls `markAllActivitiesAsReadForBoard(slug, boardSlug)` on mount to clear

## Visual Design

- **Red dot**: Small circle (8-10px), `bg-[var(--error-primary)]`, positioned absolute relative to parent
- **Dashboard card**: Top-right corner of the card, overlapping the icon
- **Workspace page header**: Near the workspace name or bell icon
- **Board navigation**: Near the board name or on the board tab

## No Changes Required

- `WorkspaceHeader` notification bell and comments button already show unread count badges — these remain unchanged
- Activity marking as read in dropdown remains unchanged
