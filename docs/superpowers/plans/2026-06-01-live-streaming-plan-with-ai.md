# Live Streaming "Plan with AI" (Board Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn board-mode "Plan with AI" into a live, section-by-section streaming experience: a progress banner appears, tasks stream onto the Kanban board into AI-assigned columns in real time, and a completion modal offers Undo all / Keep.

**Architecture:** A new SSE endpoint (`/api/ai/plan/stream`) makes a fast skeleton LLM call, then generates each section's tasks with bounded concurrency, inserting each section into MongoDB as it completes and streaming back real task IDs + an AI-chosen status. A client hook consumes the SSE stream; `board.tsx` appends streamed tasks to local state, renders the banner and completion modal, and wires an `undoAIPlan` server action. The existing `PlanWithAIModal` stays as the input surface and hands off to the stream on board-mode Generate. Project mode is untouched.

**Tech Stack:** Next.js App Router (Route Handlers + ReadableStream/SSE), React (`useState`, custom hook), TypeScript (strict, no `any`), Mongoose, MINIMAX LLM (existing `MinimaxClient`), Framer Motion, Heroicons, Tailwind + CSS custom properties, Vitest.

---

## File Structure

**Create:**
- `lib/llm/board-stream-planner.ts` — Prompts, prompt builders, and **pure** parse/normalize functions (unit-testable, no network/env).
- `app/api/ai/plan/stream/route.ts` — POST SSE endpoint: skeleton → per-section generate + insert → SSE events.
- `components/board/use-plan-stream.ts` — Client hook: opens the fetch, parses SSE frames, exposes `start/cancel/state` + callbacks.
- `components/board/plan-stream-banner.tsx` — The progress banner above the board.
- `components/board/plan-complete-modal.tsx` — Completion modal with Undo all / Keep.
- `__tests__/board-stream-planner.test.ts` — Unit tests for prompt builders + parsers + normalizers.

**Modify:**
- `lib/llm/types.ts` — Add `BoardSection`, `BoardSkeletonResponse`, `LLMSectionTask`, `SectionTasksResponse`.
- `lib/llm/client.ts` — Add `planSkeleton()` + `planSection()` methods (delegate parsing to `board-stream-planner.ts`).
- `types/ai-plan.ts` — Add `BoardStreamRequest`, `StreamedTask`, `PlanStreamEvent`.
- `actions/ai-plan.ts` — Add `undoAIPlan()` server action.
- `components/board/plan-with-ai-modal.tsx` — Add optional `onStartBoardStream?` prop; board-scale Generate calls it and closes.
- `components/board/board.tsx` — Own streaming state; wire hook; append streamed tasks; render banner + completion modal; undo handler.

**Delete:** None.

---

## Task 1: Shared Types

**Files:**
- Modify: `lib/llm/types.ts` (append)
- Modify: `types/ai-plan.ts` (append)

These contracts are imported by every later task. Define them first so everything compiles against the same shapes.

- [ ] **Step 1: Append LLM types to `lib/llm/types.ts`**

Append at the end of the file (after `ProjectPlanResponse`):

```typescript
// --- Board-mode live streaming planner ---

/** One workstream/phase in the skeleton (no tasks yet) */
export interface BoardSection {
  name: string;
  description: string;
}

/** Phase-1 skeleton response from the LLM */
export interface BoardSkeletonResponse {
  title: string;
  summary: string;
  sections: BoardSection[]; // 3-5
}

/** One task within a section, as returned by the LLM (title-case enums) */
export interface LLMSectionTask {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Backlog' | 'Todo' | 'In Progress';
  estimatedHours: number;
}

/** Phase-2 per-section response from the LLM */
export interface SectionTasksResponse {
  tasks: LLMSectionTask[];
}
```

- [ ] **Step 2: Append app/stream types to `types/ai-plan.ts`**

Append at the end of the file (after `ConfirmedPlan`):

```typescript
// --- Board-mode live streaming ---

/** The starting columns the AI may assign to a freshly-planned task */
export type StreamTaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS';

/** Request body for POST /api/ai/plan/stream */
export interface BoardStreamRequest {
    description: string;
    boardId: string;
    boardSlug: string;
    workspaceSlug: string;
    deadline?: string;
    contextLinks?: string[];
    maxTasks?: number; // total cap across all sections, default 12
}

/** A task created server-side and streamed back to the board (real DB id) */
export interface StreamedTask {
    id: string;
    title: string;
    description: string;
    status: StreamTaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedHours: number;
    order: number;
    sectionIndex: number;
}

/** Discriminated union of every SSE event the stream endpoint emits */
export type PlanStreamEvent =
    | {
          type: 'skeleton';
          title: string;
          summary: string;
          sections: { name: string; description: string }[];
      }
    | { type: 'section'; sectionIndex: number; tasks: StreamedTask[] }
    | { type: 'section_error'; sectionIndex: number; message: string }
    | {
          type: 'done';
          taskIds: string[];
          columnTotals: Record<string, number>;
          tasksCreated: number;
      }
    | { type: 'error'; message: string };
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/llm/types.ts types/ai-plan.ts
git commit -m "feat(ai-plan): add types for live streaming board planner"
```

---

## Task 2: LLM Prompts + Pure Parse/Normalize Functions

**Files:**
- Create: `lib/llm/board-stream-planner.ts`

This module holds the prompts, the user-prompt builders, and **pure** functions for extracting/validating/normalizing LLM output. Keeping parse/normalize pure (string in, typed object out — no network, no env) makes them unit-testable and lets both the client and the route reuse them (DRY).

- [ ] **Step 1: Create `lib/llm/board-stream-planner.ts`**

```typescript
// lib/llm/board-stream-planner.ts
import type {
  BoardSection,
  BoardSkeletonResponse,
  LLMSectionTask,
  SectionTasksResponse,
} from './types';
import type { StreamTaskStatus } from '@/types/ai-plan';

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const SKELETON_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, break it into a small set of high-level sections (workstreams or phases). Do NOT generate tasks yet.

Output valid JSON only — no markdown, no explanation:
{
  "title": "short project title (≤60 chars)",
  "summary": "one-sentence overview",
  "sections": [
    { "name": "Section name (≤40 chars)", "description": "what this section covers (≤120 chars)" }
  ]
}

Rules:
- 3-5 sections, ordered logically (earliest work first)
- Sections are phases or workstreams (e.g., "Setup", "Core Build", "Polish", "Launch")
- Section names are short noun phrases
- Respond ONLY with valid JSON`;

export const SECTION_SYSTEM_PROMPT = `You are a project planning assistant. Given a project and ONE section of it, generate the concrete tasks for that section only.

Output valid JSON only — no markdown, no explanation:
{
  "tasks": [
    {
      "title": "task title (≤80 chars)",
      "description": "what to do and how (≤300 chars)",
      "priority": "High|Medium|Low",
      "status": "Backlog|Todo|In Progress",
      "estimatedHours": <number>
    }
  ]
}

Rules:
- Only tasks belonging to THIS section
- Titles are imperative: "Build the homepage", not "Homepage"
- estimatedHours is a realistic integer 1-24
- status: this is a brand-new plan. Put the 1-2 most immediate, dependency-free tasks in "Todo" and the rest in "Backlog". Use "In Progress" ONLY if the description says work is already underway. NEVER use any other status.
- Respond ONLY with valid JSON`;

// ---------------------------------------------------------------------------
// User-prompt builders
// ---------------------------------------------------------------------------

export interface SkeletonPromptInput {
  description: string;
  deadline?: string;
  contextLinks?: string[];
  maxTasks?: number;
}

export function buildSkeletonUserPrompt(input: SkeletonPromptInput): string {
  let prompt = `Project description:\n${input.description}\n\n`;
  if (input.deadline) prompt += `Target completion date: ${input.deadline}\n\n`;
  if (input.contextLinks && input.contextLinks.length > 0) {
    const safe = input.contextLinks.filter(l => /^https?:\/\//i.test(l) && l.length < 512);
    if (safe.length > 0) prompt += `Reference links:\n${safe.map(l => `- ${l}`).join('\n')}\n\n`;
  }
  if (input.maxTasks) prompt += `The whole project should total about ${input.maxTasks} tasks across all sections.\n\n`;
  prompt += `Break this project into 3-5 high-level sections.`;
  return prompt;
}

export interface SectionPromptInput {
  description: string;
  section: BoardSection;
  allSections: BoardSection[];
  maxTasksForSection: number;
  deadline?: string;
}

export function buildSectionUserPrompt(input: SectionPromptInput): string {
  let prompt = `Project description:\n${input.description}\n\n`;
  prompt += `The project is divided into these sections:\n${input.allSections
    .map((s, i) => `${i + 1}. ${s.name} — ${s.description}`)
    .join('\n')}\n\n`;
  if (input.deadline) prompt += `Target completion date: ${input.deadline}\n\n`;
  prompt += `Generate up to ${input.maxTasksForSection} tasks for ONLY this section:\n`;
  prompt += `"${input.section.name}" — ${input.section.description}`;
  return prompt;
}

// ---------------------------------------------------------------------------
// JSON extraction + parsing (pure)
// ---------------------------------------------------------------------------

/** Strip markdown code fences and return the raw JSON string */
export function extractJsonString(content: string): string {
  let jsonStr = content.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return jsonStr;
}

export function parseSkeletonResponse(content: string): BoardSkeletonResponse {
  if (!content) throw new Error('No content in LLM response');
  let parsed: BoardSkeletonResponse;
  try {
    parsed = JSON.parse(extractJsonString(content)) as BoardSkeletonResponse;
  } catch {
    throw new Error('Failed to parse skeleton response as JSON');
  }
  if (!parsed.title) throw new Error('Skeleton missing required field: title');
  if (!parsed.summary) throw new Error('Skeleton missing required field: summary');
  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error('Skeleton missing sections array');
  }
  for (const s of parsed.sections) {
    if (!s.name || !s.description) throw new Error('Section missing required fields');
  }
  return parsed;
}

export function parseSectionResponse(content: string): SectionTasksResponse {
  if (!content) throw new Error('No content in LLM response');
  let parsed: SectionTasksResponse;
  try {
    parsed = JSON.parse(extractJsonString(content)) as SectionTasksResponse;
  } catch {
    throw new Error('Failed to parse section response as JSON');
  }
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error('Section response missing tasks array');
  }
  for (const t of parsed.tasks) {
    if (!t.title || !t.description || typeof t.estimatedHours !== 'number') {
      throw new Error('Section task missing required fields');
    }
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Normalizers (pure) — title-case LLM enums → app uppercase, with safe fallback
// ---------------------------------------------------------------------------

export function normalizePriority(p: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
    Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH',
    low: 'LOW', medium: 'MEDIUM', high: 'HIGH',
    LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH',
  };
  return map[p] ?? 'MEDIUM';
}

/** Clamp any model status to one of the three allowed starting columns. */
export function normalizeStatus(s: string): StreamTaskStatus {
  const key = (s ?? '').toString().trim().toLowerCase();
  const map: Record<string, StreamTaskStatus> = {
    'backlog': 'BACKLOG',
    'todo': 'TODO',
    'to do': 'TODO',
    'in progress': 'IN_PROGRESS',
    'in_progress': 'IN_PROGRESS',
    'inprogress': 'IN_PROGRESS',
  };
  return map[key] ?? 'BACKLOG';
}

export function normalizeSectionTask(t: LLMSectionTask): {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: StreamTaskStatus;
  estimatedHours: number;
} {
  return {
    title: t.title,
    description: t.description,
    priority: normalizePriority(t.priority),
    status: normalizeStatus(t.status),
    estimatedHours: t.estimatedHours,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/llm/board-stream-planner.ts
git commit -m "feat(ai-plan): add streaming board planner prompts and pure parsers"
```

---

## Task 3: Unit Tests for Planner + Client Methods

**Files:**
- Create: `__tests__/board-stream-planner.test.ts`
- Modify: `lib/llm/client.ts` (add `planSkeleton` + `planSection`)

- [ ] **Step 1: Write the failing tests**

Create `__tests__/board-stream-planner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildSkeletonUserPrompt,
  buildSectionUserPrompt,
  parseSkeletonResponse,
  parseSectionResponse,
  normalizePriority,
  normalizeStatus,
  normalizeSectionTask,
} from '../lib/llm/board-stream-planner';

describe('buildSkeletonUserPrompt', () => {
  it('includes the description', () => {
    const p = buildSkeletonUserPrompt({ description: 'Build a shop' });
    expect(p).toContain('Build a shop');
    expect(p).toContain('3-5 high-level sections');
  });
  it('includes deadline and maxTasks when provided', () => {
    const p = buildSkeletonUserPrompt({ description: 'X', deadline: '2026-07-01', maxTasks: 10 });
    expect(p).toContain('2026-07-01');
    expect(p).toContain('about 10 tasks');
  });
  it('drops non-http context links', () => {
    const p = buildSkeletonUserPrompt({ description: 'X', contextLinks: ['javascript:alert(1)', 'https://ok.com'] });
    expect(p).toContain('https://ok.com');
    expect(p).not.toContain('javascript:');
  });
});

describe('buildSectionUserPrompt', () => {
  it('names the target section and lists all sections', () => {
    const sections = [
      { name: 'Setup', description: 'init' },
      { name: 'Build', description: 'core' },
    ];
    const p = buildSectionUserPrompt({
      description: 'App', section: sections[1], allSections: sections, maxTasksForSection: 4,
    });
    expect(p).toContain('up to 4 tasks');
    expect(p).toContain('"Build"');
    expect(p).toContain('1. Setup');
  });
});

describe('parseSkeletonResponse', () => {
  it('parses a valid skeleton', () => {
    const r = parseSkeletonResponse(JSON.stringify({
      title: 'T', summary: 'S', sections: [{ name: 'A', description: 'd' }],
    }));
    expect(r.sections).toHaveLength(1);
  });
  it('parses skeleton wrapped in a code fence', () => {
    const r = parseSkeletonResponse('```json\n{"title":"T","summary":"S","sections":[{"name":"A","description":"d"}]}\n```');
    expect(r.title).toBe('T');
  });
  it('throws on invalid JSON', () => {
    expect(() => parseSkeletonResponse('not json')).toThrow();
  });
  it('throws when sections missing', () => {
    expect(() => parseSkeletonResponse(JSON.stringify({ title: 'T', summary: 'S' }))).toThrow();
  });
});

describe('parseSectionResponse', () => {
  it('parses a valid section', () => {
    const r = parseSectionResponse(JSON.stringify({
      tasks: [{ title: 'a', description: 'b', priority: 'High', status: 'Todo', estimatedHours: 3 }],
    }));
    expect(r.tasks).toHaveLength(1);
  });
  it('throws on empty tasks', () => {
    expect(() => parseSectionResponse(JSON.stringify({ tasks: [] }))).toThrow();
  });
  it('throws on missing fields', () => {
    expect(() => parseSectionResponse(JSON.stringify({ tasks: [{ title: 'a' }] }))).toThrow();
  });
});

describe('normalizePriority', () => {
  it('maps title-case and falls back to MEDIUM', () => {
    expect(normalizePriority('High')).toBe('HIGH');
    expect(normalizePriority('weird')).toBe('MEDIUM');
  });
});

describe('normalizeStatus', () => {
  it('maps allowed values', () => {
    expect(normalizeStatus('Backlog')).toBe('BACKLOG');
    expect(normalizeStatus('Todo')).toBe('TODO');
    expect(normalizeStatus('In Progress')).toBe('IN_PROGRESS');
  });
  it('clamps unknown / disallowed values to BACKLOG', () => {
    expect(normalizeStatus('Done')).toBe('BACKLOG');
    expect(normalizeStatus('Review')).toBe('BACKLOG');
    expect(normalizeStatus('')).toBe('BACKLOG');
  });
});

describe('normalizeSectionTask', () => {
  it('normalizes priority and status together', () => {
    const t = normalizeSectionTask({
      title: 'a', description: 'b', priority: 'Low', status: 'Done' as 'Backlog', estimatedHours: 2,
    });
    expect(t.priority).toBe('LOW');
    expect(t.status).toBe('BACKLOG');
  });
});
```

- [ ] **Step 2: Run the tests to verify they pass for the planner (no client changes yet)**

Run: `npm run test:run -- board-stream-planner`
Expected: all tests PASS (they only exercise Task 2's pure functions).

- [ ] **Step 3: Add `planSkeleton` + `planSection` to `lib/llm/client.ts`**

Add to the imports at the top of `client.ts` (alongside the existing `./project-planner` import):

```typescript
import {
  SKELETON_SYSTEM_PROMPT,
  SECTION_SYSTEM_PROMPT,
  buildSkeletonUserPrompt,
  buildSectionUserPrompt,
  parseSkeletonResponse,
  parseSectionResponse,
  type SkeletonPromptInput,
  type SectionPromptInput,
} from './board-stream-planner';
import type { BoardSkeletonResponse, SectionTasksResponse } from './types';
```

Add these two methods inside the `MinimaxClient` class, immediately after `planProject()`:

```typescript
async planSkeleton(input: SkeletonPromptInput): Promise<BoardSkeletonResponse> {
  const messages: LLMMessage[] = [
    { role: 'system', content: SKELETON_SYSTEM_PROMPT },
    { role: 'user', content: buildSkeletonUserPrompt(input) },
  ];
  const response = await this.callAPI(messages);
  const content = response.choices[0]?.message?.content;
  return parseSkeletonResponse(content);
}

async planSection(input: SectionPromptInput): Promise<SectionTasksResponse> {
  const messages: LLMMessage[] = [
    { role: 'system', content: SECTION_SYSTEM_PROMPT },
    { role: 'user', content: buildSectionUserPrompt(input) },
  ];
  const response = await this.callAPI(messages);
  const content = response.choices[0]?.message?.content;
  return parseSectionResponse(content);
}
```

> Note: `parseSkeletonResponse`/`parseSectionResponse` already throw on `undefined`/empty content (they check `if (!content)`), so passing `response.choices[0]?.message?.content` directly is safe.

- [ ] **Step 4: Type-check and run tests**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run test:run -- board-stream-planner`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add __tests__/board-stream-planner.test.ts lib/llm/client.ts
git commit -m "feat(ai-plan): add planSkeleton/planSection client methods + tests"
```

---

## Task 4: SSE Streaming Endpoint

**Files:**
- Create: `app/api/ai/plan/stream/route.ts`

Mirrors the auth/validation/rate-limit gates of `app/api/ai/plan/route.ts`, then streams Server-Sent Events. Each section is generated with bounded concurrency (3), inserted into MongoDB on completion, and emitted as a `section` event with real task IDs.

- [ ] **Step 1: Create `app/api/ai/plan/stream/route.ts`**

```typescript
// app/api/ai/plan/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { Task } from '@/models/Task';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { createMinimaxClient } from '@/lib/llm/client';
import { checkUserRateLimit } from '@/lib/rate-limit-enhanced';
import { revalidatePath } from 'next/cache';
import { normalizeSectionTask } from '@/lib/llm/board-stream-planner';
import type { BoardStreamRequest, PlanStreamEvent, StreamedTask } from '@/types/ai-plan';

const SECTION_CONCURRENCY = 3;
const DEFAULT_MAX_TASKS = 12;

function sse(event: PlanStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rateLimit = checkUserRateLimit(session.user.id);
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: BoardStreamRequest;
  try {
    body = (await request.json()) as BoardStreamRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { description, boardId, boardSlug, workspaceSlug, deadline, contextLinks, maxTasks } = body;

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'description must be at least 10 characters' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (description.trim().length > 5000) {
    return new Response(JSON.stringify({ error: 'description must not exceed 5000 characters' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!workspaceSlug || !boardSlug) {
    return new Response(JSON.stringify({ error: 'workspaceSlug and boardSlug are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!boardId || !Types.ObjectId.isValid(boardId)) {
    return new Response(JSON.stringify({ error: 'A valid boardId is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await connectDB();

  const workspace = await Workspace.findOne({ slug: workspaceSlug });
  if (!workspace) {
    return new Response(JSON.stringify({ error: 'Workspace not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  const member = isWorkspaceMember(workspace, session.user.id);
  if (!hasRole(member, 'ADMIN', 'EDITOR')) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }
  const board = await Board.findOne({ _id: boardId, workspaceId: workspace._id }).select('_id');
  if (!board) {
    return new Response(JSON.stringify({ error: 'Board not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  const workspaceId = workspace._id as Types.ObjectId;
  const boardObjectId = board._id as Types.ObjectId;
  const cap = typeof maxTasks === 'number' && maxTasks > 0 ? Math.min(maxTasks, 30) : DEFAULT_MAX_TASKS;
  const safeLinks = Array.isArray(contextLinks)
    ? contextLinks.filter(l => typeof l === 'string' && /^https?:\/\//i.test(l)).slice(0, 5)
    : undefined;

  const encoder = new TextEncoder();
  const baseOrder = Date.now();
  let orderCounter = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PlanStreamEvent) => controller.enqueue(encoder.encode(sse(event)));
      const aborted = () => request.signal.aborted;

      const createdTaskIds: string[] = [];
      const columnTotals: Record<string, number> = {};

      try {
        const client = createMinimaxClient();

        // Phase 1: skeleton
        const skeleton = await client.planSkeleton({
          description: description.trim(),
          deadline,
          contextLinks: safeLinks,
          maxTasks: cap,
        });
        send({
          type: 'skeleton',
          title: skeleton.title,
          summary: skeleton.summary,
          sections: skeleton.sections.map(s => ({ name: s.name, description: s.description })),
        });

        const sections = skeleton.sections;
        const perSectionCap = Math.max(2, Math.ceil(cap / sections.length));

        // Phase 2: per-section generation with bounded concurrency
        const worker = async (index: number): Promise<void> => {
          if (aborted()) return;
          try {
            const result = await client.planSection({
              description: description.trim(),
              section: sections[index],
              allSections: sections,
              maxTasksForSection: perSectionCap,
              deadline,
            });

            const normalized = result.tasks.map(normalizeSectionTask);
            const docs = normalized.map(t => ({
              workspaceId,
              boardId: boardObjectId,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              order: baseOrder + orderCounter++,
            }));

            const inserted = await Task.insertMany(docs);

            const streamed: StreamedTask[] = inserted.map((doc, i) => {
              const id = (doc._id as Types.ObjectId).toString();
              createdTaskIds.push(id);
              columnTotals[normalized[i].status] = (columnTotals[normalized[i].status] ?? 0) + 1;
              return {
                id,
                title: normalized[i].title,
                description: normalized[i].description,
                status: normalized[i].status,
                priority: normalized[i].priority,
                estimatedHours: normalized[i].estimatedHours,
                order: docs[i].order,
                sectionIndex: index,
              };
            });

            send({ type: 'section', sectionIndex: index, tasks: streamed });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Section failed';
            send({ type: 'section_error', sectionIndex: index, message });
          }
        };

        // Concurrency pool: each runner pulls the next section index
        let cursor = 0;
        const runner = async (): Promise<void> => {
          while (!aborted()) {
            const i = cursor++;
            if (i >= sections.length) return;
            await worker(i);
          }
        };
        const poolSize = Math.min(SECTION_CONCURRENCY, sections.length);
        await Promise.all(Array.from({ length: poolSize }, () => runner()));

        if (createdTaskIds.length > 0) {
          revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        }

        send({
          type: 'done',
          taskIds: createdTaskIds,
          columnTotals,
          tasksCreated: createdTaskIds.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Planning failed';
        console.error('[ai/plan/stream] error:', message);
        const friendly = message.includes('timed out')
          ? 'Request timed out — please try again'
          : 'Planning failed — please try again';
        // Surface what was created so the client can still offer Undo
        if (createdTaskIds.length > 0) {
          send({ type: 'done', taskIds: createdTaskIds, columnTotals, tasksCreated: createdTaskIds.length });
        } else {
          send({ type: 'error', message: friendly });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint the new route**

Run: `npx eslint app/api/ai/plan/stream/route.ts`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/plan/stream/route.ts
git commit -m "feat(ai-plan): add /api/ai/plan/stream SSE endpoint"
```

---

## Task 5: `undoAIPlan` Server Action

**Files:**
- Modify: `actions/ai-plan.ts` (append a new exported action)

Scoped delete: removes only tasks whose `_id ∈ taskIds` AND that belong to the given board + workspace, so it can never delete arbitrary tasks.

- [ ] **Step 1: Append the action to `actions/ai-plan.ts`**

Add this exported function at the end of `actions/ai-plan.ts` (the file already imports `auth`, `connectDB`, `Task`, `Board`, `Workspace`, `revalidatePath`, `Types`, `isWorkspaceMember`, `hasRole`):

```typescript
export async function undoAIPlan(
    workspaceSlug: string,
    boardSlug: string,
    taskIds: string[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, deleted: 0, error: 'Unauthorized' };
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return { success: true, deleted: 0 };
    }
    const validIds = taskIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
        return { success: true, deleted: 0 };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return { success: false, deleted: 0, error: 'Workspace not found' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return { success: false, deleted: 0, error: 'Permission denied' };
    }

    const boardDoc = await Board.findOne({ slug: boardSlug, workspaceId: workspace._id }).select('_id');
    if (!boardDoc) {
        return { success: false, deleted: 0, error: 'Board not found' };
    }

    try {
        const result = await Task.deleteMany({
            _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
            boardId: boardDoc._id,
            workspaceId: workspace._id,
        });
        revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        return { success: true, deleted: result.deletedCount ?? 0 };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Undo failed';
        return { success: false, deleted: 0, error: msg };
    }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add actions/ai-plan.ts
git commit -m "feat(ai-plan): add undoAIPlan scoped-delete server action"
```

---

## Task 6: `use-plan-stream` Hook

**Files:**
- Create: `components/board/use-plan-stream.ts`

Opens a `fetch` POST to the SSE endpoint, reads the body stream, parses `event:`/`data:` frames, and invokes typed callbacks. Tracks banner state (`sections`, per-section status, totals). Exposes `start`, `cancel`, and `state`.

- [ ] **Step 1: Create `components/board/use-plan-stream.ts`**

```typescript
// components/board/use-plan-stream.ts
'use client';

import { useCallback, useRef, useState } from 'react';
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
};

interface UsePlanStreamCallbacks {
  onTasks: (tasks: StreamedTask[]) => void;
  onDone: (taskIds: string[], columnTotals: Record<string, number>) => void;
}

export function usePlanStream({ onTasks, onDone }: UsePlanStreamCallbacks) {
  const [state, setState] = useState<PlanStreamState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);

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
        case 'section':
          onTasks(event.tasks);
          setState(prev => {
            const sections = prev.sections.map((s, i) =>
              i === event.sectionIndex
                ? { ...s, status: 'done' as SectionStatus, taskCount: event.tasks.length }
                : s
            );
            return { ...prev, sections };
          });
          break;
        case 'section_error':
          setState(prev => {
            const sections = prev.sections.map((s, i) =>
              i === event.sectionIndex ? { ...s, status: 'error' as SectionStatus } : s
            );
            return { ...prev, sections };
          });
          break;
        case 'done':
          setState(prev => ({
            ...prev,
            phase: prev.phase === 'cancelled' ? 'cancelled' : 'done',
            tasksCreated: event.tasksCreated,
            columnTotals: event.columnTotals,
            createdTaskIds: event.taskIds,
          }));
          onDone(event.taskIds, event.columnTotals);
          break;
        case 'error':
          setState(prev => ({ ...prev, phase: 'error', errorMessage: event.message }));
          break;
      }
    },
    [onTasks, onDone]
  );

  const start = useCallback(
    async (req: BoardStreamRequest) => {
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
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
            /* non-JSON error body; keep default */
          }
          setState(prev => ({ ...prev, phase: 'error', errorMessage: message }));
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/board/use-plan-stream.ts`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/board/use-plan-stream.ts
git commit -m "feat(ai-plan): add usePlanStream SSE-consuming hook"
```

---

## Task 7: `PlanStreamBanner` Component

**Files:**
- Create: `components/board/plan-stream-banner.tsx`

The "section above the page": project title, a progress bar, one row per section with ⟳/✓/✗ and task counts, and a Cancel button while streaming.

- [ ] **Step 1: Create `components/board/plan-stream-banner.tsx`**

```typescript
// components/board/plan-stream-banner.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { PlanStreamState } from './use-plan-stream';

interface PlanStreamBannerProps {
  state: PlanStreamState;
  onCancel: () => void;
}

export function PlanStreamBanner({ state, onCancel }: PlanStreamBannerProps) {
  const { phase, title, sections, errorMessage } = state;
  const isActive = phase === 'streaming';
  const completed = sections.filter(s => s.status !== 'pending').length;
  const progress = sections.length > 0 ? Math.round((completed / sections.length) * 100) : 0;

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="overflow-hidden"
      >
        <div className="rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/5 to-purple-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center flex-shrink-0">
                {isActive ? (
                  <ArrowPathIcon className="w-4.5 h-4.5 text-white animate-spin" />
                ) : (
                  <SparklesIcon className="w-4.5 h-4.5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {phase === 'error'
                    ? 'Planning failed'
                    : phase === 'cancelled'
                    ? `Stopped — ${state.tasksCreated} task${state.tasksCreated !== 1 ? 's' : ''} added`
                    : `Breaking down: ${title || 'your project'}`}
                </p>
                {phase === 'error' && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
                )}
              </div>
            </div>
            {isActive && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>

          {sections.length > 0 && (
            <>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Section rows */}
              <div className="mt-3 space-y-1.5">
                {sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {section.status === 'pending' && (
                      <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--brand-primary)] animate-spin flex-shrink-0" />
                    )}
                    {section.status === 'done' && (
                      <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {section.status === 'error' && (
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span
                      className={`font-medium ${
                        section.status === 'done'
                          ? 'text-[var(--foreground)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {section.name}
                    </span>
                    {section.status === 'done' && (
                      <span className="text-[var(--text-tertiary)]">
                        {section.taskCount} task{section.taskCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {section.status === 'error' && (
                      <span className="text-amber-600 dark:text-amber-400">skipped</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/board/plan-stream-banner.tsx`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/board/plan-stream-banner.tsx
git commit -m "feat(ai-plan): add PlanStreamBanner live progress component"
```

---

## Task 8: `PlanCompleteModal` Component

**Files:**
- Create: `components/board/plan-complete-modal.tsx`

Opens when the stream finishes. Shows totals + per-column breakdown, with Undo all / Keep.

- [ ] **Step 1: Create `components/board/plan-complete-modal.tsx`**

```typescript
// components/board/plan-complete-modal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const COLUMN_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
};

interface PlanCompleteModalProps {
  isOpen: boolean;
  tasksCreated: number;
  columnTotals: Record<string, number>;
  onUndo: () => Promise<void>;
  onKeep: () => void;
}

export function PlanCompleteModal({
  isOpen,
  tasksCreated,
  columnTotals,
  onUndo,
  onKeep,
}: PlanCompleteModalProps) {
  const [isUndoing, setIsUndoing] = useState(false);
  const columnCount = Object.keys(columnTotals).length;

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={isUndoing ? undefined : onKeep}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 sm:inset-0 sm:m-auto w-auto sm:max-w-md h-fit bg-[var(--surface)] rounded-2xl shadow-2xl z-50 border border-[var(--border-subtle)] p-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {tasksCreated > 0 ? 'Plan complete!' : 'Nothing was added'}
                </h2>
                {tasksCreated > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Added <span className="font-semibold text-[var(--foreground)]">{tasksCreated}</span>{' '}
                    task{tasksCreated !== 1 ? 's' : ''} across {columnCount} column{columnCount !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {tasksCreated > 0 && (
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {Object.entries(columnTotals).map(([status, count]) => (
                    <span
                      key={status}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      {COLUMN_LABELS[status] ?? status}: {count}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pt-2">
                {tasksCreated > 0 && (
                  <button
                    onClick={handleUndo}
                    disabled={isUndoing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--background-subtle)] disabled:opacity-50 transition-colors"
                  >
                    {isUndoing ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUturnLeftIcon className="w-4 h-4" />
                    )}
                    {isUndoing ? 'Undoing…' : 'Undo all'}
                  </button>
                )}
                <button
                  onClick={onKeep}
                  disabled={isUndoing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {tasksCreated > 0 ? 'Keep' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/board/plan-complete-modal.tsx`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/board/plan-complete-modal.tsx
git commit -m "feat(ai-plan): add PlanCompleteModal with Undo all"
```

---

## Task 9: Hand off from `PlanWithAIModal`

**Files:**
- Modify: `components/board/plan-with-ai-modal.tsx`

Add an optional `onStartBoardStream` prop. When present and the chosen scale is `board`, "Generate" calls it (handing off to the live stream) and closes the modal — bypassing the blocking fetch, `planning`, and `review` steps. All other paths (project mode, or the prop absent) are unchanged.

- [ ] **Step 1: Add the import for `BoardStreamRequest`**

In `components/board/plan-with-ai-modal.tsx`, extend the existing `import type { ... } from '@/types/ai-plan';` block to include `BoardStreamRequest`:

```typescript
import type {
    AIPlanRequest,
    AIPlan,
    UIAIPlan,
    UITaskPlanItem,
    BoardStreamRequest,
} from '@/types/ai-plan';
```

- [ ] **Step 2: Add the prop to `PlanWithAIModalProps`**

Add this line inside the `PlanWithAIModalProps` interface (after `forceScale`):

```typescript
    /** When provided, board-scale Generate hands off to live streaming instead of the blocking flow. */
    onStartBoardStream?: (req: BoardStreamRequest) => void;
```

- [ ] **Step 3: Destructure the prop**

Add `onStartBoardStream,` to the destructured props in the `PlanWithAIModal` function signature (after `forceScale,`).

- [ ] **Step 4: Branch in `handleGenerate`**

In `handleGenerate`, immediately after the guard block:

```typescript
        if (!description.trim()) return;
        if (scale === 'board' && !boardId) {
            setError('No board ID found — try refreshing the page.');
            return;
        }
```

insert this hand-off branch (before `setStep('planning');`):

```typescript
        // Live-streaming hand-off for board scale
        if (scale === 'board' && onStartBoardStream) {
            const links = contextLinks.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 5);
            onStartBoardStream({
                description: description.trim(),
                boardId,
                boardSlug,
                workspaceSlug,
                deadline: deadline || undefined,
                contextLinks: links.length > 0 ? links : undefined,
                maxTasks: maxTasksPerBoard ? parseInt(maxTasksPerBoard, 10) : undefined,
            });
            handleClose();
            return;
        }
```

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/board/plan-with-ai-modal.tsx`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add components/board/plan-with-ai-modal.tsx
git commit -m "feat(ai-plan): hand off board-scale generation to live stream"
```

---

## Task 10: Wire `board.tsx`

**Files:**
- Modify: `components/board/board.tsx`

Own the streaming state, wire the hook, append streamed tasks into `tasks`, render the banner above the columns and the completion modal, pass `onStartBoardStream` to `PlanWithAIModal`, and implement undo.

- [ ] **Step 1: Add imports**

Add these imports near the existing board imports (after the `PlanWithAIModal` import on line 20):

```typescript
import { PlanStreamBanner } from './plan-stream-banner';
import { PlanCompleteModal } from './plan-complete-modal';
import { usePlanStream } from './use-plan-stream';
import { undoAIPlan } from '@/actions/ai-plan';
import type { BoardStreamRequest, StreamedTask } from '@/types/ai-plan';
```

- [ ] **Step 2: Add streaming state + hook wiring**

Inside the `Board` component, after the existing `const [showPlanWithAI, setShowPlanWithAI] = useState(false);` line, add:

```typescript
    const [showPlanComplete, setShowPlanComplete] = useState(false);

    // Append streamed AI tasks into board state as real cards
    const handleStreamedTasks = useCallback((streamed: StreamedTask[]) => {
        setTasks((prev) => [
            ...prev,
            ...streamed.map((t): TaskData => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                order: t.order,
                assignees: [],
                createdAt: new Date().toISOString(),
            })),
        ]);
    }, []);

    const handleStreamDone = useCallback((taskIds: string[]) => {
        if (taskIds.length > 0) {
            setShowPlanComplete(true);
        }
    }, []);

    const planStream = usePlanStream({
        onTasks: handleStreamedTasks,
        onDone: handleStreamDone,
    });

    const handleStartBoardStream = useCallback((req: BoardStreamRequest) => {
        planStream.start(req);
    }, [planStream]);

    const handleUndoAIPlan = useCallback(async () => {
        const ids = planStream.state.createdTaskIds;
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        const removed = tasks.filter((t) => idSet.has(t.id));
        // Optimistic removal
        setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
        setShowPlanComplete(false);
        try {
            const result = await undoAIPlan(workspaceSlug, boardSlug || '', ids);
            if (!result.success) {
                // Re-add on failure
                setTasks((prev) => [...prev, ...removed]);
            }
        } catch {
            setTasks((prev) => [...prev, ...removed]);
        } finally {
            planStream.reset();
        }
    }, [planStream, tasks, workspaceSlug, boardSlug]);

    const handleKeepPlan = useCallback(() => {
        setShowPlanComplete(false);
        planStream.reset();
    }, [planStream]);
```

> Note: `useCallback` and `TaskData` are already imported in `board.tsx` (lines 3 and 17).

- [ ] **Step 3: Render the banner above the columns**

Find the empty-state / DndContext block. The board body starts with:

```tsx
            {optimisticTasks.length === 0 && !isReadOnly ? (
```

Immediately **before** that line, insert the banner so it sits above both the empty state and the columns:

```tsx
            <PlanStreamBanner state={planStream.state} onCancel={planStream.cancel} />

```

- [ ] **Step 4: Pass `onStartBoardStream` to `PlanWithAIModal`**

Find the existing `PlanWithAIModal` usage (around line 889) and add the `onStartBoardStream` prop:

```tsx
            <PlanWithAIModal
                isOpen={showPlanWithAI}
                onClose={() => setShowPlanWithAI(false)}
                boardId={boardId || ''}
                boardSlug={boardSlug || ''}
                boardName={boardName}
                workspaceSlug={workspaceSlug}
                onStartBoardStream={handleStartBoardStream}
            />
```

- [ ] **Step 5: Render the completion modal**

Immediately after the `PlanWithAIModal` block from Step 4, add:

```tsx
            <PlanCompleteModal
                isOpen={showPlanComplete}
                tasksCreated={planStream.state.tasksCreated}
                columnTotals={planStream.state.columnTotals}
                onUndo={handleUndoAIPlan}
                onKeep={handleKeepPlan}
            />
```

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/board/board.tsx`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add components/board/board.tsx
git commit -m "feat(ai-plan): wire live streaming banner, tasks, and undo into board"
```

---

## Task 11: Full Verification Gate

Per CLAUDE.md, the production build is a non-negotiable gate.

- [ ] **Step 1: Run the unit tests**

Run: `npm run test:run -- board-stream-planner`
Expected: all tests PASS.

- [ ] **Step 2: Full type check**

Run: `npx tsc --noEmit`
Expected: no output (zero errors).

- [ ] **Step 3: Lint all touched files**

Run:
```bash
npx eslint lib/llm/types.ts lib/llm/client.ts lib/llm/board-stream-planner.ts types/ai-plan.ts app/api/ai/plan/stream/route.ts actions/ai-plan.ts components/board/use-plan-stream.ts components/board/plan-stream-banner.tsx components/board/plan-complete-modal.tsx components/board/plan-with-ai-modal.tsx components/board/board.tsx
```
Expected: 0 errors (warnings acceptable).

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. The new `app/api/ai/plan/stream` route should appear as a dynamic route (`ƒ`).

- [ ] **Step 5: Manual smoke test (dev server)**

Run: `npm run dev`, then in the app:
1. Open a board, click **Plan with AI**, keep scale on **This board**, describe a project (e.g., "Build a restaurant website — homepage, menu, booking, contact"), click **Generate**.
2. Verify the modal closes and the banner appears: "Breaking down: …" with section rows flipping ⟳ → ✓.
3. Verify tasks stream into columns — most in **Backlog**/**To Do**, none in Review/Done.
4. Verify the completion modal shows totals; click **Undo all** and confirm exactly those tasks disappear.
5. Re-run, and this time click **Cancel** mid-stream — confirm it stops and already-added tasks remain.

- [ ] **Step 6: Final commit (if any cleanup was needed)**

```bash
git add -u
git commit -m "feat(ai-plan): complete live streaming Plan with AI (board mode)"
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Banner above the page ("Breaking down: {project}") — Task 7, rendered in Task 10 Step 3.
- ✅ Real-time section-by-section streaming via SSE — Tasks 4 + 6.
- ✅ Tasks sorted into AI-assigned columns — `status` in section prompt (Task 2), normalized + clamped (Task 2/4), rendered by existing `getTasksByColumn`.
- ✅ Persist per section with real IDs — Task 4 `Task.insertMany` per section.
- ✅ Go-direct with Undo — no review step on the board path (Task 9 hand-off); `undoAIPlan` (Task 5) + completion modal (Task 8).
- ✅ Completion modal on finish — Task 8, opened in Task 10 Step 2/5.
- ✅ Board mode only; project mode untouched — Task 9 branches only when `scale === 'board' && onStartBoardStream`.
- ✅ Cancel mid-stream — hook `cancel` (Task 6), banner button (Task 7), server checks `request.signal.aborted` (Task 4).
- ✅ Error matrix (skeleton fail / section fail / partial / cancel / network) — Task 4 emits `error`/`section_error`/`done`; hook + banner surface them.
- ✅ Auth + role gates mirror existing route — Task 4 (and stricter ADMIN/EDITOR for writes, matching `createFromAIPlan`).
- ✅ Tests for prompts/parsers/normalizers — Task 3.

**Type consistency:**
- `BoardStreamRequest`, `StreamedTask`, `PlanStreamEvent`, `StreamTaskStatus` defined in Task 1 (`types/ai-plan.ts`) and consumed identically by the route (Task 4), hook (Task 6), modal (Task 9), and board (Task 10).
- `PlanStreamState`/`BannerSection` defined in the hook (Task 6) and consumed by the banner (Task 7) via `import type`.
- `normalizeSectionTask`/`normalizeStatus`/`normalizePriority` defined once in Task 2, reused by the route (Task 4) — DRY.
- Method names `planSkeleton`/`planSection` consistent between Task 3 (client) and Task 4 (route).
- `usePlanStream` returns `{ state, start, cancel, reset }` (Task 6), all four used in Task 10.

**No placeholders:** Every code step contains complete, runnable code. No TBD/TODO/"similar to above".
