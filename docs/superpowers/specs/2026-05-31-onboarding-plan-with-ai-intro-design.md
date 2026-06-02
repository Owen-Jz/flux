# Onboarding: "What are you working on today?" — Plan with AI Intro

**Date:** 2026-05-31
**Status:** Approved — implementing

## Goal

When a new user lands on their workspace home page for the first time, surface the
"Plan with AI" capability immediately via a two-phase prompt, so they discover the
feature early instead of stumbling onto it later. New users arrive with an empty
workspace (no boards), so the flow defaults to **project** scale (generate boards +
tasks from scratch).

## User Flow

1. New user (within their 7-day onboarding window) opens their workspace home page.
2. **Phase 1 — Intro modal:** A centered, branded modal appears: "What are you
   working on today?" with a single textarea and two buttons — "Plan it with AI"
   (primary) and "Skip for now" (secondary). Backdrop click = skip.
3. On **Plan it with AI**: the intro modal closes, the flag is persisted, and the
   full `PlanWithAIModal` opens immediately — pre-seeded with their description,
   scale locked to `project`, starting at the `input` step (scope selection skipped).
4. On **Skip for now** (or backdrop): the flag is persisted; nothing else happens.
   The intro never shows again for this user.

## Data Model

Add one boolean to `onboardingProgress` in `models/User.ts`:

```ts
onboardingProgress?: {
    // ...existing fields...
    planWithAIIntroShown?: boolean;
};
```

No migration required — Mongoose treats absent fields as falsy. Schema gets a matching
`planWithAIIntroShown: { type: Boolean, default: false }`.

## Server Actions (`actions/onboarding.ts`)

- `shouldShowPlanWithAIIntro(): Promise<boolean>` — returns `true` only if:
  authenticated, `onboardingProgress.planWithAIIntroShown` falsy, AND the user is a
  new user (reuse the same "within 7 days / brand new" logic as
  `isEligibleForOnboarding`). Returns `false` otherwise. Defensive: try/catch
  returning `false` on error.
- `markPlanWithAIIntroShown(): Promise<{ success: boolean; error?: string }>` —
  sets `onboardingProgress.planWithAIIntroShown = true`. Idempotent. Called on both
  "Plan it with AI" and "Skip."

## Components

### `components/onboarding/plan-with-ai-intro-modal.tsx` (new)

Phase 1 modal. Visual style matches `TrialPromptModal`:
- Gradient top stripe, centered overlay with `backdrop-blur-sm`, `framer-motion`
  entrance.
- `SparklesIcon` in a gradient bubble.
- Headline: **"What are you working on today?"**
- Subtext: "Tell us what you're building and we'll map out the boards and tasks for
  you with AI."
- A `<textarea>` (maxLength 1000) using the existing `.input` class.
- Primary CTA **"Plan it with AI"** — disabled until non-empty trimmed input.
- Secondary **"Skip for now"**.
- Backdrop click triggers the skip handler.

Props:
```ts
interface PlanWithAIIntroModalProps {
    isOpen: boolean;
    onSubmit: (description: string) => void;  // "Plan it with AI"
    onSkip: () => void;                        // "Skip for now" / backdrop
}
```

### `components/board/plan-with-ai-modal.tsx` (modify — additive only)

Add three optional props (all default to current behavior when omitted):
```ts
initialStep?: PlanStep;        // start step (default 'scope')
initialDescription?: string;   // pre-seed description textarea (default '')
forceScale?: 'board' | 'project'; // lock scale + hide scope step (default undefined)
```

Behavior changes (guarded so existing board usage is unchanged):
- `useState` initializers read from these props: `useState(initialStep ?? 'scope')`,
  `useState(initialDescription ?? '')`, `useState(forceScale ?? 'board')`.
- When `forceScale` is set, the **input step's "Back" button is hidden** (there is no
  scope step to go back to in this flow).
- `handleReset` resets to the same prop-derived initial values (so "Start over" in a
  forced-scale session keeps scale locked and returns to the input step, not scope).

Because the intro wrapper mounts `PlanWithAIModal` fresh at handoff, prop-based
`useState` initializers apply correctly.

### `components/onboarding/plan-with-ai-intro-wrapper.tsx` (new)

Thin `'use client'` orchestrator placed on the workspace home page.
- Props: `{ workspaceSlug: string }`.
- On mount: calls `shouldShowPlanWithAIIntro()`. If false, renders nothing.
- Phase state: `'intro' | 'plan' | 'done'`.
- Renders `PlanWithAIIntroModal` in `intro` phase. On submit: stores description,
  calls `markPlanWithAIIntroShown()`, transitions to `plan`. On skip: calls
  `markPlanWithAIIntroShown()`, transitions to `done` (renders nothing).
- In `plan` phase: renders `PlanWithAIModal` with `isOpen`, `initialStep="input"`,
  `forceScale="project"`, `initialDescription={typed}`, `workspaceSlug`, and empty
  `boardId`/`boardSlug`/`boardName` (unused in project mode). `onClose` → `done`.

## Wiring (`app/[slug]/page.tsx`)

Add `<PlanWithAIIntroWrapper workspaceSlug={slug} />` alongside the existing
`<TrialPromptWrapper />` / `<ReferralPromptWrapper />`. No other page changes.

## Interaction with existing prompts

`TrialPromptWrapper` already suppresses itself while the user is in the onboarding
window (`isEligibleForOnboarding`), so the trial offer will not compete with the
Plan-with-AI intro for brand-new users. `ReferralPrompt` only fires after the "aha
moment" (first board + first task), so it won't collide either.

## Out of Scope (YAGNI)

- No analytics events beyond what already exists.
- No change to the board-scoped Plan with AI entry points.
- No re-show / "remind me later" mechanics — single-shot, like the referral prompt.

## Verification Gates (CLAUDE.md mandatory)

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
