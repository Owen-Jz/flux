# Unread Indicator (Red Dot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show red dot indicators on workspace cards (dashboard), workspace page header, and board navigation when there are unread notifications or comments. Visiting the page marks items as read.

**Architecture:** Add board-scoped unread tracking to activity system. Extend workspace list to include per-workspace unread counts. Add red dot UI to dashboard cards, workspace page header, and board navigation bar. "Mark as read on visit" keeps the model simple.

**Tech Stack:** Next.js (App Router), Mongoose, Server Actions, Framer Motion (for dot animation)

---

## File Map

| File | Change |
|------|--------|
| `actions/activity.ts` | Add `getUnreadActivityCountForBoard` and `markAllActivitiesAsReadForBoard` |
| `actions/workspace.ts` | Add `getWorkspaceUnreadCounts(slugs: string[])` returning `Record<string, number>` |
| `components/dashboard/WorkspaceCard.tsx` | Add `hasUnread?: boolean` prop; render red dot |
| `app/dashboard/page.tsx` | Fetch unread counts; pass `hasUnread` to each `WorkspaceCard` |
| `app/[slug]/page.tsx` | Fetch unread count; show red dot in header; call `markAllActivitiesAsRead` on mount |
| `app/[slug]/board/[boardSlug]/page.tsx` | Fetch board-scoped unread count; show red dot; call `markAllActivitiesAsReadForBoard` on mount |

---

## Task 1: Add board-scoped activity server actions

**Files:**
- Modify: `actions/activity.ts`

- [ ] **Step 1: Add `getUnreadActivityCountForBoard`**

Add after the existing `getUnreadActivityCount` function (around line 216):

```typescript
export async function getUnreadActivityCountForBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return 0;

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) return 0;

    const count = await ActivityLog.countDocuments({
        workspaceId: workspace._id,
        boardId: board._id,
        read: false,
    });

    return count;
}
```

- [ ] **Step 2: Add `markAllActivitiesAsReadForBoard`**

Add after `markAllActivitiesAsRead` (around line 214):

```typescript
export async function markAllActivitiesAsReadForBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return { success: false };

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) return { success: false };

    await ActivityLog.updateMany(
        { workspaceId: workspace._id, boardId: board._id, read: false },
        { read: true }
    );

    return { success: true };
}
```

- [ ] **Step 3: Verify file compiles**

Run: `npx tsc --noEmit actions/activity.ts`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add actions/activity.ts
git commit -m "feat: add board-scoped unread activity tracking"
```

---

## Task 2: Add workspace-level bulk unread count action

**Files:**
- Modify: `actions/workspace.ts`

- [ ] **Step 1: Add `getWorkspaceUnreadCounts`**

Add after `getWorkspaces` (around line 103):

```typescript
export async function getWorkspaceUnreadCounts(workspaceSlugs: string[]) {
    const session = await auth();
    if (!session?.user?.id || workspaceSlugs.length === 0) {
        return {};
    }

    await connectDB();

    const workspaces = await Workspace.find({
        slug: { $in: workspaceSlugs },
        'members.userId': session.user.id,
    }).select('_id slug').lean();

    if (workspaces.length === 0) return {};

    const workspaceIds = workspaces.map(w => w._id);
    const unreadCounts = await ActivityLog.aggregate([
        {
            $match: {
                workspaceId: { $in: workspaceIds },
                read: false,
            },
        },
        {
            $group: {
                _id: '$workspaceId',
                count: { $sum: 1 },
            },
        },
    ]);

    const slugToCount: Record<string, number> = {};
    unreadCounts.forEach(entry => {
        const ws = workspaces.find(w => w._id.toString() === entry._id.toString());
        if (ws) slugToCount[ws.slug] = entry.count;
    });

    return slugToCount;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit actions/workspace.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add actions/workspace.ts
git commit -m "feat: add bulk unread count for workspaces"
```

---

## Task 3: Add `hasUnread` prop and red dot to WorkspaceCard

**Files:**
- Modify: `components/dashboard/WorkspaceCard.tsx`

- [ ] **Step 1: Add `hasUnread` prop**

Update the interface (around line 6):

```typescript
interface WorkspaceCardProps {
    name: string;
    slug: string;
    accentColor?: string;
    icon?: {
        type: 'upload' | 'emoji';
        url?: string;
        emoji?: string;
    };
    memberCount: number;
    boardCount: number;
    lastActiveAt: Date;
    hasUnread?: boolean;  // ADD THIS
}
```

Update the function signature (around line 56):

```typescript
export function WorkspaceCard({
    name,
    slug,
    accentColor,
    icon,
    memberCount,
    boardCount,
    lastActiveAt,
    hasUnread,  // ADD THIS
}: WorkspaceCardProps) {
```

- [ ] **Step 2: Add red dot to card**

In the `<Link>` wrapper, after the card content starts (around line 69), find the icon area and add a red dot badge. The icon area is the `<div className="w-14 h-14 rounded-2xl...">` block starting around line 81. Wrap that div in a `relative` container and add the dot:

Replace the icon div wrapper (line 81):
```tsx
{/* Avatar Circle */}
<div className="relative flex-shrink-0">
    <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg overflow-hidden ${
            icon?.type === 'upload' ? '' : 'text-white'
        }`}
        style={icon?.type === 'upload' ? {} : { background: gradient }}
    >
        {icon?.type === 'emoji' ? (
            <span className="text-3xl">{icon.emoji}</span>
        ) : icon?.type === 'upload' ? (
            <img src={icon.url} alt="" className="w-full h-full object-cover" />
        ) : (
            initial
        )}
    </div>
    {hasUnread && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--error-primary)] rounded-full border-2 border-[var(--surface)]" />
    )}
</div>
```

- [ ] **Step 3: Verify file compiles**

Run: `npx tsc --noEmit components/dashboard/WorkspaceCard.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/WorkspaceCard.tsx
git commit -m "feat: add hasUnread prop and red dot to WorkspaceCard"
```

---

## Task 4: Update dashboard page to fetch and pass `hasUnread`

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Import `getWorkspaceUnreadCounts`**

Add to imports (line 4):
```typescript
import { getWorkspaceUnreadCounts } from '@/actions/workspace';
```

- [ ] **Step 2: Fetch unread counts and pass to cards**

After getting workspaces (line 15), add:
```typescript
const unreadCounts = await getWorkspaceUnreadCounts(workspaces.map(w => w.slug));
```

Then in the workspace grid (around line 97), update the WorkspaceCard call:
```tsx
<WorkspaceCard
    key={workspace.id}
    name={workspace.name}
    slug={workspace.slug}
    accentColor={workspace.accentColor}
    icon={workspace.icon}
    memberCount={workspace.memberCount}
    boardCount={workspace.boardCount}
    lastActiveAt={workspace.lastActiveAt}
    hasUnread={(unreadCounts[workspace.slug] ?? 0) > 0}
/>
```

- [ ] **Step 3: Verify file compiles**

Run: `npx tsc --noEmit app/dashboard/page.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: pass hasUnread prop to WorkspaceCard"
```

---

## Task 5: Update workspace page with red dot and mark-as-read on mount

**Files:**
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Import actions**

Add to imports:
```typescript
import { getUnreadActivityCount, markAllActivitiesAsRead } from '@/actions/activity';
```

- [ ] **Step 2: Add client component for red dot and mark-as-read**

Since `app/[slug]/page.tsx` is a server component, create a small client component. First, add a client wrapper. The page fetches data and needs to call `markAllActivitiesAsRead` on mount — create a `WorkspaceUnreadDot` client component inline in the file or in a separate file.

**Option A — inline client component in the server page file:**

Add at the end of the file (or better, add as a separate file `app/[slug]/workspace-unread-dot.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getUnreadActivityCount, markAllActivitiesAsRead } from '@/actions/activity';

interface WorkspaceUnreadDotProps {
    workspaceSlug: string;
}

export function WorkspaceUnreadDot({ workspaceSlug }: WorkspaceUnreadDotProps) {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // Fetch and mark as read on mount
        Promise.all([
            getUnreadActivityCount(workspaceSlug),
            markAllActivitiesAsRead(workspaceSlug),
        ]).then(([count]) => {
            setHasUnread(count > 0);
        });
    }, [workspaceSlug]);

    if (!hasUnread) return null;

    return (
        <span className="ml-2 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[var(--error-primary)]" />
    );
}
```

- [ ] **Step 3: Use the component in workspace page header**

In the workspace page header area (around line 39 where `workspace.name` is displayed), wrap the name with the dot:

```tsx
<h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
    {workspace.name}
    <WorkspaceUnreadDot workspaceSlug={slug} />
</h1>
```

Import the new component at the top.

- [ ] **Step 4: Verify file compiles**

Run: `npx tsc --noEmit app/[slug]/page.tsx app/[slug]/workspace-unread-dot.tsx`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/[slug]/page.tsx app/[slug]/workspace-unread-dot.tsx
git commit -m "feat: add red dot and mark-as-read to workspace page"
```

---

## Task 6: Update board page with red dot and mark-as-read on mount

**Files:**
- Create: `app/[slug]/board/[boardSlug]/board-unread-dot.tsx`
- Modify: `app/[slug]/board/[boardSlug]/page.tsx`
- Modify: `components/board/board.tsx`

- [ ] **Step 1: Import actions**

In `app/[slug]/board/[boardSlug]/page.tsx`, add to imports:
```typescript
import { getUnreadActivityCountForBoard, markAllActivitiesAsReadForBoard } from '@/actions/activity';
```

- [ ] **Step 2: Create client component for board unread dot**

Create `app/[slug]/board/[boardSlug]/board-unread-dot.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getUnreadActivityCountForBoard, markAllActivitiesAsReadForBoard } from '@/actions/activity';

interface BoardUnreadDotProps {
    workspaceSlug: string;
    boardSlug: string;
}

export function BoardUnreadDot({ workspaceSlug, boardSlug }: BoardUnreadDotProps) {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        Promise.all([
            getUnreadActivityCountForBoard(workspaceSlug, boardSlug),
            markAllActivitiesAsReadForBoard(workspaceSlug, boardSlug),
        ]).then(([count]) => {
            setHasUnread(count > 0);
        });
    }, [workspaceSlug, boardSlug]);

    if (!hasUnread) return null;

    return (
        <span className="ml-2 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[var(--error-primary)]" />
    );
}
```

- [ ] **Step 3: Pass BoardUnreadDot into the Board component**

In `app/[slug]/board/[boardSlug]/page.tsx`, import and pass the dot as a prop to `Board`:

```typescript
import { BoardUnreadDot } from './board-unread-dot';
```

In the `<Board>` JSX, add the dot prop. Find the `<Board` component call and add:
```tsx
<Board
    initialTasks={tasks}
    workspaceSlug={slug}
    boardSlug={boardSlug}
    boardId={board.id}
    isReadOnly={isReadOnly}
    members={workspace.members.map((m: any) => ({
        id: m.userId,
        name: m.user?.name || 'Unknown User',
        email: m.user?.email || '',
        image: m.user?.image,
        role: m.role,
    }))}
    boardName={board.name}
    boardDescription={board.description}
    boardColor={board.color}
    categories={board.categories}
    currentUserId={session?.user?.id}
    hasUnread={<BoardUnreadDot workspaceSlug={slug} boardSlug={boardSlug} />}
/>
```

You will also need to add `hasUnread?: React.ReactNode` to the `BoardProps` interface in `components/board/board.tsx`.

- [ ] **Step 4: Add `hasUnread` prop to Board component and render it**

In `components/board/board.tsx`:

**4a.** Add `hasUnread?: React.ReactNode;` to the `BoardProps` interface (around line 42).

**4b.** Add `hasUnread,` to the function signature (around line 67).

**4c.** In the navigation bar (lines 616-624), change:
```tsx
<h1 className="text-lg md:text-xl font-bold text-[var(--foreground)] tracking-tight truncate">
    {boardName}
</h1>
```
to:
```tsx
<h1 className="text-lg md:text-xl font-bold text-[var(--foreground)] tracking-tight truncate flex items-center gap-2">
    <span>{boardName}</span>
    {hasUnread}
</h1>
```

- [ ] **Step 5: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add app/[slug]/board/[boardSlug]/board-unread-dot.tsx app/[slug]/board/[boardSlug]/page.tsx components/board/board.tsx
git commit -m "feat: add red dot and mark-as-read to board page"
```

---

## Task 7: Verify end-to-end

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Smoke test**

Open `http://localhost:3000/dashboard` — workspace cards should show red dot if there are unread activities
Open a workspace page — should see red dot next to name if unread
Open a board page — should see red dot in board area if unread
After visiting each, the dot should disappear on next visit

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: verify end-to-end unread indicator functionality"
```
