# Plan Limits & Quota Enforcement — Problem & Intention

**Date:** 2026-06-09
**Branch:** chore/cron-auth-fix-and-landing-wip
**Status:** ✅ Implemented & verified — `tsc` clean, changed files lint-clean, `npm run build` green (104 pages). Not yet committed.

## Problem

The Free plan advertises "3 Projects • 3 Team Members" but the platform under-enforces
its own limits, which both leaks paid value and gives free users no reason to upgrade:

1. **Tasks are unlimited on every plan.** `PLAN_LIMITS.*.tasks === 'unlimited'` and
   `createTask` performs **no** count check. A free workspace can hold infinite tasks.
2. **AI "Plan with AI" has no per-plan quota.** Both AI routes apply only a flat in-memory
   `20 requests / hour` rate limit, identical for free and paid, with no monthly refresh.
   Free users can generate unlimited plans (subject only to the hourly burst limit).
3. **Resource caps key off the *acting user's* plan, not the workspace.** A "20 tasks total"
   cap must be a per-**workspace** cap; board/member caps should reflect the workspace
   **owner's** plan (`Workspace.ownerId`), not whoever happens to click the button.
4. **Upgrade prompts are reactive only** (an error string after an action fails) and there is
   no usage visibility ("18 / 20 tasks") anywhere in the product.

## Intention

Make the plan a real, consistently-enforced contract across the whole system — server
actions, API routes, and UI — so free users hit clear, friendly upgrade walls and paid
plans get a monthly-refreshing allowance. Enforcement lives at the data-mutation boundary
(defence in depth), and the UI surfaces remaining allowance + upgrade CTAs proactively.

## Decisions (defaults — numbers are single-constant edits in `PLAN_LIMITS`)

| Plan                     | Boards | Active tasks (per workspace) | Members | AI plans / month |
|--------------------------|--------|------------------------------|---------|------------------|
| free                     | 3      | **20**                       | 3       | **3**            |
| starter (Individual)     | 5      | unlimited                    | 10      | **50**           |
| pro (Entrepreneur)       | unlimited | unlimited                 | 25      | **200**          |
| enterprise (Business)    | unlimited | unlimited                 | unlimited | unlimited      |

- **AI credits refresh monthly (30-day rolling window) for *all* plans.** Free = 3 / month.
  This satisfies both "3 free tries then upgrade" and "paid limit that refreshes" with one
  mechanism, and avoids a dead-end lifetime cap. Tracked on the **User** (`aiCreditsUsed`,
  `aiCreditsResetAt`); consumed per *attempt*, **refunded on our own server/LLM failure** so
  a Flux-side error never burns a user's credit. Keyed off the **acting user's** effective
  plan (the "tries" are the person's).
- **Active tasks** = non-`ARCHIVED` tasks in the workspace. Archiving frees room. The cap is
  resolved against the **workspace owner's** effective plan so capacity is consistent
  regardless of which member creates a task.
- **Boards & members** caps migrate to the **workspace owner's** effective plan (was: acting
  user). `createWorkspace` count stays keyed to the acting user (it limits how many
  workspaces a *person* can own/join, not a workspace resource).
- The anonymous marketing "Try it" endpoint (`/api/ai/plan/try`) keeps its existing per-IP /
  global daily quota — unchanged.
- `getEffectivePlan` is used everywhere so expired trials / inactive subs correctly fall back
  to free.

## Architecture

**Foundation (single sources of truth):**
- `lib/paystack.ts` `PLAN_LIMITS` — add numeric `tasks` (free 20) + `aiCredits` per plan.
- `lib/plan-limits.ts` — `getTaskLimit`, `canCreateTask`, `getAiCreditLimit`; extend
  `getUpgradeMessage` to cover `tasks` and `ai`; extend `PLAN_META`.
- `lib/types/billing.ts` — extend `PlanMeta`.
- `models/User.ts` — `aiCreditsUsed: number` (default 0), `aiCreditsResetAt?: Date`.
- `lib/ai-credits.ts` (new) — atomic `consumeAiCredit` / `refundAiCredit` / `getAiCreditStatus`
  (reset-then-`$inc`-under-`$lt`-guard; safe under concurrency across instances).
- `lib/workspace-plan.ts` (new) — `resolveWorkspacePlan(ownerId)` → owner's effective plan.

**Enforcement:**
- `actions/task.ts` `createTask` — count check via workspace-owner plan.
- `actions/ai-plan.ts` `createFromAIPlan` — task cap on bulk insert.
- `app/api/ai/plan/route.ts` + `/stream/route.ts` — consume AI credit (refund on failure);
  stream also caps inserted tasks to remaining allowance.
- `actions/board.ts`, `actions/workspace-invite.ts` — migrate to workspace-owner plan.
- `app/api/ai/credits/route.ts` (new, GET) — credit status for UI.
- `actions/usage.ts` (new) — `getWorkspaceUsage(slug)` → counts + limits for the usage meter.

**UI:**
- `app/pricing/page.tsx` + `components/billing/billing-section.tsx` — reflect 20-task / AI
  limits; add a live usage meter (boards / tasks / members / AI) on billing.
- `components/board/plan-with-ai-modal.tsx` (+ stream error surface) — show remaining AI plans
  and a clear Upgrade CTA when the limit is hit.

## Verification gate (mandatory)
`npx tsc --noEmit` → `npm run lint` → `npm run build`, all green, before declaring done.
