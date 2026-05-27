# Onboarding Flow Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the onboarding flow so every new user — whether signing up organically or via team invite — goes through the full onboarding before landing in a workspace, and ensure the tutorial guide is accurate on both desktop and mobile.

**Architecture:** Three independent subsystems are broken: (1) the redirect chain that gates new users into onboarding, (2) the invite-to-onboarding data pipeline that passes workspace membership info forward, and (3) the tutorial/guided-session UI that has mobile responsiveness and accuracy gaps. Fixes are layered: server-side redirect logic first, then data plumbing, then UI corrections.

**Tech Stack:** Next.js 16 App Router, NextAuth v5, Mongoose/MongoDB, React, Tailwind CSS, dnd-kit, driver.js

---

## Findings Summary

After tracing every code path end-to-end, here are the bugs and gaps:

### Critical — Broken Flows

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 1 | **Credentials invited users skip onboarding entirely.** After OTP verification, user logs in → `login/page.tsx` redirects to `/dashboard` → dashboard sees they have workspaces (from invite processing) → shows dashboard. `hasCompletedOnboarding` is never checked. | Invited credential users never see onboarding or the workspace-switch prompt. | `app/login/page.tsx:63`, `app/dashboard/page.tsx:24` |
| 2 | **Google OAuth invite parameter mismatch.** Signup page passes `callbackUrl=/onboarding?invite=TOKEN` but onboarding reads `params.get('invited')` (expects JSON-encoded workspace array, not a token). | Google OAuth invited users see onboarding but step 4 (workspace switch) never appears. | `app/signup/page.tsx:89`, `app/onboarding/page.tsx:26` |
| 3 | **Signup API returns `addedWorkspaces` but frontend ignores it.** The credential signup flow discards the response payload and hard-redirects to `/verify-email`. The workspace data is lost. | Even if we fixed #1, we'd have no way to show which workspaces the user joined. | `app/signup/page.tsx:77`, `app/api/auth/signup/route.ts:109` |
| 4 | **"Start Tour" button does LESS than "Skip".** Skip calls `updateOnboardingProgress('completedTutorial')` + `markOnboardingComplete()` before advancing. "Start Tour" just advances to step 4 or redirects — no progress marking, no completion flag. | Users who click "Start Tour" have incomplete onboarding state. Tutorial provider may re-trigger later since `hasSeenDashboard` is not set. | `app/onboarding/page.tsx:393-406` |

### Medium — Mobile & Tutorial Accuracy

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 5 | **Drag demo 3-column layout doesn't collapse on mobile.** `flex gap-3` with three `flex-1` columns renders unusable on screens < 400px. | Users on phones cannot complete the drag-and-drop guided step. | `components/onboarding/steps/drag-demo-step.tsx:182` |
| 6 | **Shortcuts step shows keyboard shortcuts on mobile.** Keyboard shortcuts are irrelevant on touch devices — wastes a step. | Confusing UX for mobile users. | `components/onboarding/steps/shortcuts-step.tsx` |
| 7 | **Color picker touch targets too small.** Board creator color buttons are `w-8 h-8` (32×32px) — below the 44×44px WCAG minimum for touch. | Hard to select colors on mobile. | `components/onboarding/steps/board-creator-step.tsx:101` |
| 8 | **Onboarding page tour step describes actions users haven't done yet.** Step 3 lists "Drag a task", "Assign yourself", "Add a comment" as if they're about to do them, but clicking "Start Tour" navigates away without starting any interactive walkthrough. The actual walkthrough is a separate component (TutorialProvider) that runs 15s after landing on the board page. | Misleading — user expects an interactive tour and gets redirected instead. | `app/onboarding/page.tsx:360-374` |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/dashboard/page.tsx` | Modify | Add `hasCompletedOnboarding` gate before workspace display |
| `app/onboarding/page.tsx` | Modify | Fetch invited workspaces server-side; fix "Start Tour" behavior |
| `actions/onboarding.ts` | Modify | Add `getInvitedWorkspaces()` server action |
| `app/signup/page.tsx` | Modify | Remove broken `invite` param forwarding (no longer needed) |
| `components/onboarding/steps/drag-demo-step.tsx` | Modify | Mobile-responsive column layout + touch sensor |
| `components/onboarding/steps/shortcuts-step.tsx` | Modify | Hide keyboard shortcuts on touch devices; show touch tips instead |
| `components/onboarding/steps/board-creator-step.tsx` | Modify | Enlarge color picker touch targets |

---

## Task 1: Gate Dashboard Behind Onboarding Completion

The root cause of issue #1 is that `dashboard/page.tsx` only checks `workspaces.length === 0` to redirect to onboarding. Invited users have workspaces, so they skip onboarding. We need to also check `hasCompletedOnboarding`.

**Files:**
- Modify: `app/dashboard/page.tsx:14-26`

- [ ] **Step 1: Add onboarding completion check to dashboard**

In `app/dashboard/page.tsx`, after the session check and before the workspace fetch, query the user's `hasCompletedOnboarding` flag. If false, redirect to `/onboarding`.

Replace lines 14–26:

```tsx
export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Gate: if user hasn't completed onboarding, send them there first
    try {
        await connectDB();
        const onboardingUser = await User.findById(session.user.id).select('hasCompletedOnboarding').lean();
        if (onboardingUser && !onboardingUser.hasCompletedOnboarding) {
            redirect('/onboarding');
        }
    } catch (e) {
        console.error('[Dashboard] Failed to check onboarding status:', e);
    }

    const workspaces = await getWorkspaces();

    // Redirect to onboarding if user has no workspaces
    if (workspaces.length === 0) {
        redirect('/onboarding');
    }
```

Note: `connectDB` and `User` are already imported in this file (lines 11-12).

- [ ] **Step 2: Verify login redirects now go through onboarding gate**

The credentials login (`app/login/page.tsx:63`) does `router.push('/dashboard')`. With this change, any user who hasn't completed onboarding will be caught by the dashboard gate and redirected to `/onboarding`. No changes needed in `login/page.tsx`.

The Google OAuth flow (`lib/auth.ts:18`) sets `newUser: '/onboarding'` which still works for brand-new Google users. For returning Google users, login redirects to `/dashboard` which now has the gate.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — no new types introduced

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "fix(onboarding): gate dashboard behind hasCompletedOnboarding flag

Invited users who signed up via credentials were bypassing onboarding
because they already had workspaces from invite processing. Now the
dashboard checks hasCompletedOnboarding before rendering.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Fetch Invited Workspaces Server-Side

Instead of relying on URL parameters (which are lost in the credentials flow and mismatched in Google OAuth), the onboarding page should ask the server "which workspaces was this user added to that they didn't create?"

**Files:**
- Modify: `actions/onboarding.ts` — add `getInvitedWorkspaces()`
- Modify: `app/onboarding/page.tsx` — call the new action instead of parsing URL params

- [ ] **Step 1: Add `getInvitedWorkspaces` server action**

Add this function to the end of `actions/onboarding.ts` (before the closing of the file):

```ts
export async function getInvitedWorkspaces(): Promise<Array<{ slug: string; name: string; role: string }>> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        await connectDB();
        const { Workspace } = await import('@/models/Workspace');

        const workspaces = await Workspace.find({
            'members.userId': session.user.id,
        }).select('slug name members ownerId').lean();

        return workspaces
            .filter((ws: any) => {
                // Exclude workspaces the user owns (created themselves)
                const isOwner = ws.ownerId?.toString() === session.user!.id;
                return !isOwner;
            })
            .map((ws: any) => {
                const member = ws.members.find((m: any) => m.userId.toString() === session.user!.id);
                return {
                    slug: ws.slug,
                    name: ws.name,
                    role: member?.role || 'VIEWER',
                };
            });
    } catch (error) {
        console.error('Failed to get invited workspaces:', error);
        return [];
    }
}
```

- [ ] **Step 2: Verify Workspace model field**

The Workspace model uses `ownerId` (confirmed at `models/Workspace.ts:15,48`). The `getInvitedWorkspaces` function above filters by `ws.ownerId?.toString() !== session.user.id` which correctly excludes workspaces the user created themselves.

- [ ] **Step 3: Update onboarding page to use server action**

In `app/onboarding/page.tsx`, replace the URL-param-based invited workspace detection with a server action call.

Replace the `checkAccess` useEffect (lines 22-72) with:

```tsx
useEffect(() => {
    async function checkAccess() {
        try {
            // Fetch workspaces the user was invited to (not created)
            const { getInvitedWorkspaces } = await import('@/actions/onboarding');
            const invited = await getInvitedWorkspaces();
            if (invited.length > 0) {
                setInvitedWorkspaces(invited);
            }

            // Only redirect to dashboard if user already completed onboarding
            // (belt-and-suspenders — dashboard also checks this)
            if (invited.length === 0) {
                const workspaces = await getWorkspaces();
                if (workspaces.length > 0) {
                    router.replace('/dashboard');
                    return;
                }
            }
        } catch {
            router.replace('/dashboard');
            return;
        }
        setIsLoading(false);
    }
    checkAccess();
}, [router]);
```

Also update the import at the top — remove the URL `invited` parsing since we no longer need it, and add `getInvitedWorkspaces` to the import from `@/actions/onboarding`:

```tsx
import { createWorkspace } from '@/actions/workspace';
import { getWorkspaces } from '@/actions/workspace';
import { updateOnboardingProgress, getInvitedWorkspaces } from '@/actions/onboarding';
```

And simplify the useEffect (no more URL parsing, no `decodeURIComponent`, no `JSON.parse`):

```tsx
useEffect(() => {
    async function checkAccess() {
        try {
            const invited = await getInvitedWorkspaces();
            if (invited.length > 0) {
                setInvitedWorkspaces(invited);
            }

            if (invited.length === 0) {
                const workspaces = await getWorkspaces();
                if (workspaces.length > 0) {
                    router.replace('/dashboard');
                    return;
                }
            }
        } catch {
            router.replace('/dashboard');
            return;
        }
        setIsLoading(false);
    }
    checkAccess();
}, [router]);
```

- [ ] **Step 4: Clean up signup page — remove broken invite param forwarding**

In `app/signup/page.tsx`, the Google OAuth callback URL construction (line 89) is now unnecessary since the onboarding page fetches invited workspaces server-side. Simplify:

```tsx
const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        await signIn('google', { callbackUrl: '/onboarding' });
    } finally {
        // Loading will persist until redirect
    }
};
```

The `inviteToken` variable (line 37) can remain for now — it's used nowhere else after this change, but removing the `searchParams` parsing would require verifying no other code depends on it.

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add actions/onboarding.ts app/onboarding/page.tsx app/signup/page.tsx
git commit -m "fix(onboarding): fetch invited workspaces server-side instead of URL params

The URL-param approach was broken in two ways: credentials flow lost the
data at the verify-email redirect, and Google OAuth passed 'invite=TOKEN'
but onboarding read 'invited=JSON'. Now the onboarding page calls a
server action to find workspaces where the user is a member but not the
creator.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Fix "Start Tour" Button Behavior

Currently, "Start Tour" (line 393) just navigates away without marking anything. "Skip" (line 380) marks `completedTutorial` + `markOnboardingComplete()`. This is backwards.

The correct behavior:
- **"Start Tour"** → mark onboarding complete, navigate to the workspace board. The TutorialProvider (driver.js) will auto-start the interactive tour when the user lands on the board page.
- **"Skip Tour"** → mark onboarding complete, navigate to workspace root (no tour).

**Files:**
- Modify: `app/onboarding/page.tsx:377-408`

- [ ] **Step 1: Fix button handlers for step 3**

Replace the step 3 action buttons (lines 377-408) with:

```tsx
<div className="flex gap-3">
    <button
        type="button"
        onClick={async () => {
            await markOnboardingComplete();
            if (invitedWorkspaces.length > 0) {
                setStep(4);
            } else {
                router.push(ownWorkspaceSlug ? `/${ownWorkspaceSlug}` : '/dashboard');
            }
        }}
        className="btn btn-secondary flex-1"
    >
        Skip Tour
    </button>
    <button
        type="button"
        onClick={async () => {
            await markOnboardingComplete();
            if (invitedWorkspaces.length > 0) {
                setStep(4);
            } else {
                // Navigate to workspace — TutorialProvider auto-starts the tour
                router.push(ownWorkspaceSlug ? `/${ownWorkspaceSlug}` : '/dashboard');
            }
        }}
        className="btn btn-primary flex-1"
    >
        Start Tour
        <ArrowRightIcon className="w-4 h-4" />
    </button>
</div>
```

Both buttons now call `markOnboardingComplete()`. The difference is semantic for now (both go to the same place), but when the user lands in the workspace, the TutorialProvider will detect they haven't seen the dashboard tour and start it after 15 seconds. The "Skip" label signals to the user they can bypass the tour experience.

- [ ] **Step 2: Update step 3 description to set expectations**

The current step 3 description says "Take a quick interactive tour of your board" which implies something starts immediately. Update the description to match reality:

Replace lines 355-357:

```tsx
<h2 className="text-2xl font-bold text-[var(--foreground)]">Quick tour</h2>
<p className="text-[var(--text-secondary)]">Here&apos;s what you can do in your workspace</p>
```

This sets expectations that the list is informational, not an immediate interactive experience. The actual tour triggers via TutorialProvider after they land.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix(onboarding): fix Start Tour button to mark onboarding complete

Previously, Start Tour did less than Skip - it navigated without marking
completion. Now both buttons call markOnboardingComplete() before
advancing. Updated step 3 copy to set correct expectations about the
tour experience.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Mobile-Responsive Drag Demo

The drag demo renders three `flex-1` columns side by side which breaks on phones. Also, the `PointerSensor` with 8px distance is too sensitive for touch — use `TouchSensor` as well.

**Files:**
- Modify: `components/onboarding/steps/drag-demo-step.tsx`

- [ ] **Step 1: Add TouchSensor and responsive layout**

Replace the sensors setup (lines 108-114):

```tsx
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
```

And the `useSensors` call:

```tsx
const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 150,
            tolerance: 5,
        },
    })
);
```

- [ ] **Step 2: Make columns stack on narrow screens**

Replace the column container (line 182):

```tsx
<div className="flex flex-col sm:flex-row gap-3">
```

And update the `DroppableColumn` component's min-height to work vertically:

```tsx
function DroppableColumn({
    id,
    title,
    children,
    isOver,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
    isOver: boolean;
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-h-[80px] sm:min-h-[120px] p-2 rounded-lg transition-all ${
                isOver
                    ? 'bg-[var(--brand-primary)]/10 ring-2 ring-[var(--brand-primary)]/30'
                    : 'bg-[var(--background-subtle)]/50'
            }`}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <div
                    className={`w-1.5 h-1.5 rounded-full ${
                        id === 'BACKLOG'
                            ? 'bg-[var(--text-tertiary)]'
                            : id === 'TODO'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                    }`}
                />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{title}</span>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/steps/drag-demo-step.tsx
git commit -m "fix(onboarding): make drag demo mobile-responsive with touch support

Columns now stack vertically on narrow screens. Added TouchSensor
alongside PointerSensor for reliable mobile drag-and-drop.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Mobile-Aware Shortcuts Step

Keyboard shortcuts are useless on mobile. Instead of removing the step entirely (it's mapped to `completedTutorial` in the checklist), show touch-relevant tips on mobile.

**Files:**
- Modify: `components/onboarding/steps/shortcuts-step.tsx`

- [ ] **Step 1: Add touch detection and alternative content**

Replace the entire component body with mobile-aware content. The key changes:
1. Detect touch device via `window.matchMedia('(pointer: coarse)')`
2. Show touch tips instead of keyboard shortcuts on touch devices

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { updateOnboardingProgress } from '@/actions/onboarding';

interface ShortcutsStepProps {
    onComplete: () => void;
    onSkip: () => void;
}

const SHORTCUTS = [
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['C'], description: 'Create new task' },
    { keys: ['/'], description: 'Search tasks' },
    { keys: ['↑', '↓'], description: 'Navigate tasks' },
    { keys: ['Enter'], description: 'Open selected task' },
    { keys: ['E'], description: 'Edit selected task' },
    { keys: ['Del'], description: 'Delete selected task' },
    { keys: ['Esc'], description: 'Close modal/dialog' },
];

const TOUCH_TIPS = [
    { icon: '👆', description: 'Tap a task to view details' },
    { icon: '↕️', description: 'Long-press and drag to move tasks' },
    { icon: '➕', description: 'Tap + to create a new task' },
    { icon: '👤', description: 'Tap the avatar to assign yourself' },
    { icon: '💬', description: 'Swipe left on a task for quick actions' },
    { icon: '🔍', description: 'Use the search bar to find tasks' },
];

function ShortcutKey({ keys }: { keys: string[] }) {
    return (
        <div className="flex items-center gap-1">
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    <kbd className="px-2 py-1 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded text-xs font-mono font-semibold text-[var(--text-primary)] shadow-sm">
                        {key}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-[var(--text-secondary)]">/</span>}
                </React.Fragment>
            ))}
        </div>
    );
}

export function ShortcutsStep({ onComplete, onSkip }: ShortcutsStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            await updateOnboardingProgress('completedTutorial');
            onComplete();
        } catch (error) {
            console.error('Failed to update onboarding progress:', error);
            onComplete();
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[var(--flux-warning-bg)]">
                    <AcademicCapIcon className="w-7 h-7 text-[var(--flux-warning-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {isTouchDevice ? 'Quick Tips' : 'Keyboard Shortcuts'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {isTouchDevice
                        ? 'Here are some tips to help you get the most out of Flux on mobile.'
                        : 'Speed up your workflow with these handy keyboard shortcuts.'}
                </p>
            </div>

            {/* Content */}
            <div className="bg-[var(--background-subtle)]/50 rounded-lg p-4 space-y-2">
                {isTouchDevice
                    ? TOUCH_TIPS.map((tip, i) => (
                          <div
                              key={i}
                              className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-[var(--background-subtle)] transition-colors"
                          >
                              <span className="text-lg w-6 text-center flex-shrink-0">{tip.icon}</span>
                              <span className="text-sm text-[var(--text-secondary)]">{tip.description}</span>
                          </div>
                      ))
                    : SHORTCUTS.map((shortcut, i) => (
                          <div
                              key={i}
                              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--background-subtle)] transition-colors"
                          >
                              <span className="text-sm text-[var(--text-secondary)]">{shortcut.description}</span>
                              <ShortcutKey keys={shortcut.keys} />
                          </div>
                      ))}
            </div>

            {!isTouchDevice && (
                <p className="text-xs text-center text-[var(--text-tertiary)]">
                    Press <kbd className="px-1.5 py-0.5 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded text-xs font-mono">?</kbd> anywhere to see all shortcuts
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onSkip}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--background-subtle)]"
                >
                    Skip
                </button>
                <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                    {isLoading ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Got It!
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/shortcuts-step.tsx
git commit -m "fix(onboarding): show touch tips instead of keyboard shortcuts on mobile

Detects touch devices via pointer:coarse media query and shows relevant
mobile interaction tips instead of keyboard shortcuts.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Enlarge Color Picker Touch Targets

The board creator color buttons are 32×32px — below the 44×44px WCAG minimum for touch targets.

**Files:**
- Modify: `components/onboarding/steps/board-creator-step.tsx:95-109`

- [ ] **Step 1: Increase color button size**

Replace the color picker buttons (lines 95-109):

```tsx
<div className="flex gap-2.5 flex-wrap">
    {BOARD_COLORS.map((c) => (
        <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-10 h-10 rounded-lg transition-all ${
                color === c
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--foreground)] scale-110'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
        />
    ))}
</div>
```

Changed `w-8 h-8` to `w-10 h-10` (40×40px — close to WCAG minimum, balanced with the modal width) and `gap-2` to `gap-2.5` for better spacing.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/board-creator-step.tsx
git commit -m "fix(onboarding): enlarge color picker touch targets to 40px

Previous 32px buttons were below WCAG touch target minimum.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Production Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS — this is the mandatory gatekeeper per CLAUDE.md

- [ ] **Step 4: If any gate fails, fix immediately**

If `tsc` or `build` fails, analyze the error, fix it, and re-run. If not fixable after 2 attempts, revert with `git restore <file>` and report the failure.

---

## Flow Verification Checklist

After all tasks are complete, verify these scenarios work correctly:

### Scenario A: New credential user (no invite)
1. `/signup` → fill form → submit
2. `/verify-email` → enter OTP
3. `/login` → enter credentials
4. **Expected:** redirected to `/onboarding` (dashboard gate catches `hasCompletedOnboarding=false`)
5. Complete all 4 steps (welcome → workspace → tour info → redirect)
6. Land in workspace with checklist visible

### Scenario B: Invited credential user
1. Receive invite email → click link → `/signup?invite=TOKEN`
2. Fill form → submit → `/verify-email` → OTP → `/login`
3. **Expected:** redirected to `/onboarding` (dashboard gate catches `hasCompletedOnboarding=false`)
4. Onboarding fetches invited workspaces server-side → step 4 appears
5. User can choose invited workspace or own workspace

### Scenario C: New Google OAuth user (no invite)
1. `/signup` → click "Continue with Google"
2. **Expected:** Google callback → NextAuth `newUser: '/onboarding'`
3. Complete onboarding → land in workspace

### Scenario D: Invited Google OAuth user
1. `/signup?invite=TOKEN` → click "Continue with Google"
2. **Expected:** callback → `/onboarding`
3. Onboarding fetches invited workspaces server-side → step 4 appears

### Scenario E: Mobile user
1. Go through any signup flow
2. **Expected:** drag demo shows stacked columns, touch drag works
3. **Expected:** shortcuts step shows touch tips, not keyboard shortcuts
4. **Expected:** color picker buttons are 40×40px minimum
