# Live Streaming "Plan with AI" — Board Mode

**Date:** 2026-06-01
**Status:** Approved design — ready for implementation plan
**Scope:** Board mode only. Project mode is untouched.

---

## 1. Problem

Today's "Plan with AI" (board mode) is a blocking experience:

1. User opens `PlanWithAIModal`, describes the project, clicks **Generate**.
2. One large `/api/ai/plan` LLM call runs behind a 5–15s spinner — **nothing is visible** during this time.
3. A review step appears; user confirms.
4. `createFromAIPlan` bulk-inserts every task (all into `BACKLOG`) in one shot.
5. A "Done" modal appears.

The single large LLM call + single bulk insert means the user stares at a spinner and then everything appears at once. It *feels* slow and opaque, and every task lands in `BACKLOG` regardless of sequencing.

## 2. Goal

Turn board-mode generation into a **live, real-time experience**:

- A **banner/section above the board** ("Breaking down: {project}") appears immediately.
- Tasks **stream onto the Kanban board section-by-section** as the AI generates them.
- Each task is **sorted into the right column** — the AI assigns a starting status (`BACKLOG` / `TODO` / `IN_PROGRESS`).
- When generation finishes, a **completion modal** appears with **Undo all** / **Keep**.

Decisions locked during brainstorming:

| Decision | Choice |
| --- | --- |
| Streaming model | **True streaming** — skeleton call, then per-section LLM calls over SSE |
| Review step | **Go direct, with Undo** (no pre-commit review) |
| Column sorting | **AI assigns a status per task** |
| Scope | **Board mode only** (project mode keeps the existing modal flow) |
| Persistence | **Persist per section** — DB insert as each section completes, stream real IDs |
| Trigger UX | **Keep the modal for input**, then hand off to the live stream |

## 3. Non-goals

- Project mode (multi-board) live streaming — out of scope; its path is unchanged.
- Real partial-JSON token streaming — rejected as fragile. Each LLM call returns small, complete JSON.
- New per-task plan-limit gate — board-mode AI insertion has no task gate today; we keep that. The `maxTasks` input bounds total volume.
- Touching `/api/v1/tasks/decompose`, `/api/ai/plan`, or the project-mode review flow.

---

## 4. Architecture

### 4.1 End-to-end flow

```
PlanWithAIModal (scale === 'board', user clicks Generate)
   │  onStartBoardStream(streamRequest)   ──►  board.tsx sets streamingPlan, modal closes
   ▼
POST /api/ai/plan/stream  (Server-Sent Events, text/event-stream)
   1. Gate: auth() + isWorkspaceMember + board exists in workspace   (mirror /api/ai/plan)
   2. LLM call #1  → SKELETON  { title, summary, sections:[{name,description}] }
                                                                     emit  event: skeleton
   3. For each section (bounded concurrency = 3):
        LLM call → { tasks:[{title,description,priority,status,estimatedHours}] }
        validate + clamp status; Task.insertMany(docs)  → real Mongoose docs
                                                                     emit  event: section
        (on failure of one section)                                 emit  event: section_error
   4. revalidatePath(`/${workspaceSlug}/board/${boardSlug}`)
                                                                     emit  event: done { taskIds, columnTotals }
   close stream
   ▼
board.tsx (via use-plan-stream hook) consumes events:
   • skeleton      → render PlanStreamBanner with sections (⟳ pending)
   • section       → append real tasks to `tasks` state (framer-motion entrance); flip section row ✓ with count
   • section_error → mark that section row failed; keep going
   • done          → open PlanCompleteModal (Undo all / Keep); store created taskIds for undo
   • error         → banner shows error + Retry; nothing further created
```

**Why per-section calls:** each LLM response is a small, complete JSON object — parsed with the same defensive validation as the existing `parseProjectPlanResponse`. No partial-JSON parsing. Sections are the natural unit for both the streaming banner and the DB writes.

**Why bounded concurrency = 3:** truly sequential (1 skeleton + up to 5 sections) could be slower wall-clock than today's single call. Running up to 3 section calls at once keeps the board filling quickly while staying live. Sections are emitted in completion order; column placement is independent of section order, so out-of-order arrival is fine.

### 4.2 Status assignment rules (prompt-enforced)

The section prompt instructs the LLM to set each task's `status`:

- Allowed values for a fresh plan: `BACKLOG`, `TODO`, `IN_PROGRESS`.
- `REVIEW` and `DONE` are **never** used (nothing is reviewed/done in a brand-new plan).
- The 1–2 most immediate, no-dependency tasks → `TODO`. Everything else → `BACKLOG`.
- `IN_PROGRESS` only if the description explicitly says something is already underway.

The server **clamps** any out-of-range/invalid status to `BACKLOG` as a defensive fallback (never trusts the model blindly).

### 4.3 Ordering

Each inserted task gets `order = baseTimestamp + globalIndex` where `baseTimestamp = Date.now()` captured once per request. This appends streamed tasks after any pre-existing cards (existing tasks use small indices or `Date.now()`), and preserves generation order within a column. No per-column DB max-order query needed.

---

## 5. Files

### Create

| File | Purpose |
| --- | --- |
| `lib/llm/board-stream-planner.ts` | `SKELETON_SYSTEM_PROMPT`, `SECTION_SYSTEM_PROMPT`, `buildSkeletonUserPrompt()`, `buildSectionUserPrompt()` |
| `app/api/ai/plan/stream/route.ts` | `POST` SSE endpoint: skeleton → per-section generate + insert → events |
| `components/board/use-plan-stream.ts` | Client hook: opens fetch, parses SSE, exposes `start/cancel/state` + callbacks |
| `components/board/plan-stream-banner.tsx` | The "section above the board" — title, section rows (⟳/✓/✗), progress bar, Cancel |
| `components/board/plan-complete-modal.tsx` | Completion modal — "Added N tasks across M columns", **Undo all** / **Keep** |

### Modify

| File | Change |
| --- | --- |
| `lib/llm/types.ts` | Add `BoardSection`, `BoardSkeletonResponse`, `LLMSectionTask`, `SectionTasksResponse` |
| `lib/llm/client.ts` | Add `planSkeleton()` + `planSection()` methods and their parsers |
| `types/ai-plan.ts` | Add `BoardStreamRequest`, `StreamedTask`, and the `PlanStreamEvent` discriminated union |
| `actions/ai-plan.ts` | Add `undoAIPlan(workspaceSlug, boardSlug, taskIds)` server action |
| `components/board/plan-with-ai-modal.tsx` | Add optional `onStartBoardStream?(req: BoardStreamRequest)` prop; board-scale Generate calls it + closes instead of the blocking fetch/review |
| `components/board/board.tsx` | Own `streamingPlan` state; wire the hook; append streamed tasks to `tasks`; render banner + completion modal; `handleUndoAIPlan` |

### Delete

None. The existing project-mode path and `/api/ai/plan` stay intact.

---

## 6. Contracts

### 6.1 Request — `BoardStreamRequest` (`types/ai-plan.ts`)

```typescript
export interface BoardStreamRequest {
    description: string;
    boardId: string;
    boardSlug: string;
    workspaceSlug: string;
    deadline?: string;
    contextLinks?: string[];
    maxTasks?: number; // total cap, default 12
}
```

### 6.2 SSE events — `PlanStreamEvent` (`types/ai-plan.ts`)

Each SSE message is `event: <type>\ndata: <json>\n\n`. The `data` payloads:

```typescript
export interface StreamedTask {
    id: string;                 // real Mongo _id
    title: string;
    description: string;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedHours: number;
    order: number;
    sectionIndex: number;
}

export type PlanStreamEvent =
    | { type: 'skeleton'; title: string; summary: string;
        sections: { name: string; description: string }[] }
    | { type: 'section'; sectionIndex: number; tasks: StreamedTask[] }
    | { type: 'section_error'; sectionIndex: number; message: string }
    | { type: 'done'; taskIds: string[];
        columnTotals: Record<string, number>; tasksCreated: number }
    | { type: 'error'; message: string };
```

### 6.3 LLM responses (`lib/llm/types.ts`)

```typescript
export interface BoardSection { name: string; description: string; }

export interface BoardSkeletonResponse {
    title: string;
    summary: string;
    sections: BoardSection[]; // 3-5
}

export interface LLMSectionTask {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Backlog' | 'Todo' | 'In Progress';
    estimatedHours: number;
}

export interface SectionTasksResponse { tasks: LLMSectionTask[]; }
```

The server normalizes priority (`High→HIGH`, …, fallback `MEDIUM`) and status (`Backlog→BACKLOG`, `Todo→TODO`, `In Progress→IN_PROGRESS`, fallback `BACKLOG`), mirroring the existing priority-normalization in `/api/ai/plan`.

### 6.4 Undo action (`actions/ai-plan.ts`)

```typescript
export async function undoAIPlan(
    workspaceSlug: string,
    boardSlug: string,
    taskIds: string[]
): Promise<{ success: boolean; deleted: number; error?: string }>;
```

Gates: `auth()` → `isWorkspaceMember` → `hasRole(member, 'ADMIN', 'EDITOR')`. Deletes only tasks whose `_id ∈ taskIds` **and** `boardId === board._id` **and** `workspaceId === workspace._id` (scoped delete; can't delete arbitrary tasks). `revalidatePath` the board. Returns count.

---

## 7. UI behaviour

### 7.1 `PlanStreamBanner` (above the board, below the header)

- Visible whenever `streamingPlan` is active (generating) **or** just finished but not dismissed.
- Header row: sparkle icon + "Breaking down: **{title}**" + a thin progress bar (`completedSections / totalSections`).
- One row per skeleton section: spinner (`⟳`) while pending, check (`✓ {n} tasks`) when its `section` event lands, warning (`✗`) on `section_error`.
- **Cancel** button while generating → calls `hook.cancel()` (aborts the fetch). Already-created tasks remain; banner switches to "Stopped — {n} tasks added" and the completion modal still offers Undo.
- Uses existing theme tokens (`--surface`, `--border-subtle`, `--brand-primary`) and `framer-motion` for mount/section transitions, consistent with the current modal.

### 7.2 Task entrance on the board

When a `section` event arrives, board.tsx appends its `StreamedTask[]` to `tasks` (mapped to `TaskData`: `assignees: []`, `createdAt: now`). Each new card animates in (framer-motion fade/scale). Because tasks already carry real IDs and AI-assigned `status`, the existing `getTasksByColumn` renders them into the correct columns with no extra logic.

### 7.3 `PlanCompleteModal`

- Opens on `done`. Copy: "Done! Added **{tasksCreated}** tasks across **{M}** columns." plus a small per-column breakdown from `columnTotals`.
- **Undo all** → `handleUndoAIPlan(taskIds)`: optimistic-remove those IDs from `tasks`, call `undoAIPlan`; on failure, re-add and surface an error.
- **Keep** (primary) → close modal, clear `streamingPlan`.

### 7.4 Modal handoff (`PlanWithAIModal`)

- New optional prop `onStartBoardStream?(req: BoardStreamRequest)`.
- In `handleGenerate`, when `scale === 'board'` **and** `onStartBoardStream` is provided: build the `BoardStreamRequest`, call `onStartBoardStream(req)`, then `handleClose()`. Do **not** hit `/api/ai/plan` or enter the `planning`/`review` steps.
- When `scale === 'project'` (or the prop is absent — e.g. onboarding intro handoff): unchanged existing behaviour.

---

## 8. Error handling matrix

| Failure | Server | Client |
| --- | --- | --- |
| Auth / not a member / board missing | HTTP 401/403/404 before stream starts | Banner shows error + Retry; nothing created |
| Skeleton LLM call fails | emit `error`, close | Banner: "Couldn't plan — try again" + Retry |
| One section LLM/insert fails | emit `section_error`, continue others | That section row marked ✗; others still fill |
| All sections fail | `done` with `tasksCreated: 0` | Completion modal notes nothing was added |
| User cancels | `request.signal` aborts; stop scheduling further sections | Banner: "Stopped — {n} added"; modal offers Undo |
| Network/stream drop mid-way | n/a | hook `onError`; created tasks persist (real) |
| Undo fails | action returns `{success:false}` | Re-add removed tasks; toast/inline error |

Every section insert is independent, so a partial failure never corrupts the board — it just yields fewer tasks.

---

## 9. Testing

- **Unit (`vitest`)**: `lib/llm/board-stream-planner.ts` prompt builders (deadline/links/maxTasks branches); client parsers for skeleton + section incl. malformed JSON, missing fields, invalid status/priority (→ clamp), empty arrays.
- **Unit**: status/priority normalization helpers in the route (export them or a shared util).
- **Action**: `undoAIPlan` scoping — refuses tasks from another board/workspace; role gate.
- **Manual / build gate** (per CLAUDE.md): `npx tsc --noEmit`, `npm run lint`, `npm run build` all green. Manual run: generate on an empty board, watch sections stream in, tasks land in correct columns, completion modal, Undo removes exactly those tasks, Cancel mid-stream behaves.

---

## 10. Build sequence (for the plan)

1. Types — `lib/llm/types.ts` + `types/ai-plan.ts` (contracts first).
2. LLM prompts + client methods + parsers (`board-stream-planner.ts`, `client.ts`).
3. SSE endpoint (`app/api/ai/plan/stream/route.ts`).
4. `undoAIPlan` action.
5. `use-plan-stream` hook.
6. `PlanStreamBanner` + `PlanCompleteModal`.
7. Wire `PlanWithAIModal` (`onStartBoardStream`).
8. Wire `board.tsx` (state, hook, render, undo).
9. Tests + full build gate.

Each step ends with `npx tsc --noEmit` green before moving on.
