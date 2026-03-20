# Workspace Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/dashboard` redirect behavior with a visual workspace selection grid where users see all their workspaces as clickable cards.

**Architecture:** The dashboard page becomes a server component that fetches workspaces with stats (member count, board count, last active) and renders either a responsive card grid or an empty state. Workspace cards are client components with hover animations. No new API endpoints needed — enhance the existing `getWorkspaces()` action.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Framer Motion, Mongoose

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `actions/workspace.ts` | Modify | Enhance `getWorkspaces()` to return stats |
| `app/dashboard/page.tsx` | Replace | Render workspace grid instead of redirect |
| `components/dashboard/WorkspaceCard.tsx` | Create | Single workspace card client component |
| `components/dashboard/EmptyWorkspaces.tsx` | Create | Empty state with CTA |
| `components/skeletons/DashboardSkeleton.tsx` | Modify | Update to match new dashboard layout |

---

## Task 1: Enhance `getWorkspaces()` with stats

**File:** `actions/workspace.ts`

- [ ] **Step 1: Modify `getWorkspaces()` to add stats**

Replace the existing `getWorkspaces()` function (lines 46-66) with this enhanced version that includes member count, board count, and last active timestamp:

```typescript
export async function getWorkspaces() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspaces = await Workspace.find({
        'members.userId': session.user.id,
    })
        .select('name slug settings updatedAt members')
        .lean();

    // Get board counts and most recent activity per workspace
    const workspaceIds = workspaces.map((w) => w._id);
    const boards = await Board.find({
        workspaceId: { $in: workspaceIds },
    })
        .select('workspaceId updatedAt')
        .lean();

    // Aggregate board stats per workspace
    const boardStats = boards.reduce(
        (acc, board) => {
            const wid = board.workspaceId.toString();
            if (!acc[wid]) {
                acc[wid] = { count: 0, lastActive: new Date(0) };
            }
            acc[wid].count += 1;
            if (board.updatedAt > acc[wid].lastActive) {
                acc[wid].lastActive = board.updatedAt;
            }
            return acc;
        },
        {} as Record<string, { count: number; lastActive: Date }>
    );

    return workspaces
        .map((w) => {
            const wid = w._id.toString();
            const stats = boardStats[wid] || { count: 0, lastActive: w.updatedAt };
            return {
                id: wid,
                name: w.name,
                slug: w.slug,
                publicAccess: w.settings?.publicAccess || false,
                accentColor: w.settings?.accentColor,
                memberCount: w.members.length,
                boardCount: stats.count,
                lastActiveAt: stats.lastActive,
            };
        })
        .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
}
```

**Note:** The `Board` model must be imported at the top of the file. Add it to the existing imports from `@/models/Board`.

- [ ] **Step 2: Commit**

```bash
git add actions/workspace.ts
git commit -m "feat(dashboard): enhance getWorkspaces with memberCount, boardCount, lastActiveAt

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create `WorkspaceCard` component

**File:** `components/dashboard/WorkspaceCard.tsx` (create new)

- [ ] **Step 1: Create the component**

```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface WorkspaceCardProps {
    id: string;
    name: string;
    slug: string;
    accentColor?: string;
    memberCount: number;
    boardCount: number;
    lastActiveAt: Date;
}

// Generate a deterministic gradient from workspace name
function getGradient(name: string, accentColor?: string): string {
    if (accentColor) {
        // Create a lighter version of the accent color for gradient
        return `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`;
    }
    // Fallback gradients based on name hash
    const gradients = [
        'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
}

function formatLastActive(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function WorkspaceCard({
    name,
    slug,
    accentColor,
    memberCount,
    boardCount,
    lastActiveAt,
}: WorkspaceCardProps) {
    const gradient = getGradient(name, accentColor);
    const initial = name.charAt(0).toUpperCase();

    return (
        <Link href={`/${slug}`} className="block">
            <motion.div
                className="card overflow-hidden cursor-pointer group"
                whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)' }}
                transition={{ duration: 0.2 }}
            >
                {/* Gradient Header */}
                <div
                    className="h-20 flex items-center justify-center"
                    style={{ background: gradient }}
                >
                    <span className="text-3xl font-bold text-white opacity-90">
                        {initial}
                    </span>
                </div>

                {/* Card Body */}
                <div className="p-5">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 truncate">
                        {name}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            {memberCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            {boardCount}
                        </span>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                        Last active {formatLastActive(new Date(lastActiveAt))}
                    </p>
                </div>
            </motion.div>
        </Link>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/WorkspaceCard.tsx
git commit -m "feat(dashboard): add WorkspaceCard component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create `EmptyWorkspaces` component

**File:** `components/dashboard/EmptyWorkspaces.tsx` (create new)

- [ ] **Step 1: Create the component**

```typescript
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyWorkspaces() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            {/* Illustration */}
            <div className="w-24 h-24 mb-6 rounded-2xl bg-[var(--background-subtle)] flex items-center justify-center">
                <svg
                    className="w-12 h-12 text-[var(--text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
            </div>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                No workspaces yet
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                Create your first workspace to get started with organizing your projects, boards, and tasks.
            </p>

            <Link href="/onboarding">
                <Button size="lg" rightIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                }>
                    Create your first workspace
                </Button>
            </Link>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/EmptyWorkspaces.tsx
git commit -m "feat(dashboard): add EmptyWorkspaces component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update dashboard page

**File:** `app/dashboard/page.tsx`

- [ ] **Step 1: Replace the page content**

Replace the entire file with:

```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaces } from '@/actions/workspace';
import { WorkspaceCard } from '@/components/dashboard/WorkspaceCard';
import { EmptyWorkspaces } from '@/components/dashboard/EmptyWorkspaces';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const workspaces = await getWorkspaces();

    // Empty state — no workspaces
    if (workspaces.length === 0) {
        return <EmptyWorkspaces />;
    }

    const userName = session.user.name?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        Your Workspaces
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Welcome back, {userName}. Select a workspace to continue.
                    </p>
                </div>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {workspaces.map((workspace) => (
                        <WorkspaceCard
                            key={workspace.id}
                            id={workspace.id}
                            name={workspace.name}
                            slug={workspace.slug}
                            accentColor={workspace.accentColor}
                            memberCount={workspace.memberCount}
                            boardCount={workspace.boardCount}
                            lastActiveAt={workspace.lastActiveAt}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): replace redirect with workspace selection grid

Shows all workspaces as clickable cards with member/board counts and
last active time. Empty state redirects to onboarding.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update DashboardSkeleton

**File:** `components/skeletons/DashboardSkeleton.tsx`

- [ ] **Step 1: Update skeleton to match new card design**

Replace the skeleton grid with workspace card placeholders that match `WorkspaceCard` layout — gradient header bar + body with member/board count stat placeholders. Remove the avatar row at the bottom.

```typescript
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-9 w-48 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>

                {/* Card Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card overflow-hidden">
                            {/* Gradient Header */}
                            <Skeleton className="h-20 w-full" />
                            {/* Card Body */}
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4 rounded-md" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                </div>
                                <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/skeletons/DashboardSkeleton.tsx
git commit -m "refactor(dashboard): update DashboardSkeleton to match new card layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Verification

After implementing, verify:

1. **Build passes:** `npm run build` completes without errors
2. **Dashboard renders:** Navigate to `/dashboard` — you should see workspace cards or empty state
3. **Cards are clickable:** Clicking a workspace navigates to `/{slug}`
4. **Empty state works:** Create a test user with no workspaces to verify empty state and CTA
5. **Responsive:** Resize browser — grid adapts from 4 columns → 3 → 2 → 1
6. **Stats accurate:** Card member/board counts match actual data
