# Plan with AI — Multi-Scale Project Planning

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade "Plan with AI" from single-board task generation into a unified, multi-scale planning wizard that lets users choose between generating tasks on the current board or generating an entire multi-board project — with a review step before anything is created.

**Architecture:** A new multi-step modal (`PlanWithAIModal`) replaces `AIDecomposeModal` in the board UI. It calls a new `/api/ai/plan` endpoint that returns a dry-run plan (no DB writes). The user reviews and edits the plan, then a new `createFromAIPlan` server action bulk-creates boards and tasks. The existing `/api/v1/tasks/decompose` REST endpoint is preserved for API consumers.

**Tech Stack:** Next.js App Router, React `useState` wizard pattern, TypeScript, Mongoose, MINIMAX LLM (existing client), Tailwind + CSS custom properties, Framer Motion, Heroicons.

---

## File Structure

**Create:**
- `types/ai-plan.ts` — All shared TypeScript interfaces for the planning feature
- `lib/llm/project-planner.ts` — LLM prompts and response parsing for project/board planning
- `app/api/ai/plan/route.ts` — POST endpoint: calls LLM, returns plan (no DB writes)
- `actions/ai-plan.ts` — Server action: bulk-creates boards + tasks from confirmed plan
- `components/board/plan-with-ai-modal.tsx` — Multi-step wizard modal component

**Modify:**
- `lib/llm/client.ts` — Add `planProject()` method to `MinimaxClient`
- `lib/llm/types.ts` — Add `ProjectPlanRequest`, `ProjectPlanResponse`, `BoardPlanItem`, `TaskPlanItem`
- `components/board/board.tsx` — Replace `AIDecomposeModal` with `PlanWithAIModal`; remove old modal import

**Delete (after wiring):**
- `components/board/ai-decompose-modal.tsx` — Replaced by `PlanWithAIModal`

---

## Task 1: Shared Types

**Files:**
- Create: `types/ai-plan.ts`

These types are used by the API route, server action, LLM layer, and modal — define them first so all tasks compile against the same contracts.

- [ ] **Step 1: Create `types/ai-plan.ts`**

```typescript
// types/ai-plan.ts

/** A single task as returned by the LLM (no DB fields yet) */
export interface TaskPlanItem {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedHours: number;
}

/** A board with its tasks, as returned by the LLM (project mode only) */
export interface BoardPlanItem {
    name: string;
    description: string;
    tasks: TaskPlanItem[];
}

/** The full plan returned by /api/ai/plan */
export interface AIPlan {
    type: 'board' | 'project';
    title: string;
    summary: string;
    tasks?: TaskPlanItem[];    // board mode only
    boards?: BoardPlanItem[];  // project mode only
}

/** UI-augmented task (adds checkbox state for the review step) */
export interface UITaskPlanItem extends TaskPlanItem {
    selected: boolean;
}

/** UI-augmented board (adds checkbox + expand state for the review step) */
export interface UIBoardPlanItem extends Omit<BoardPlanItem, 'tasks'> {
    tasks: UITaskPlanItem[];
    selected: boolean;
    expanded: boolean;
}

/** Full UI plan (AIPlan with UI state fields) */
export interface UIAIPlan {
    type: 'board' | 'project';
    title: string;
    summary: string;
    tasks?: UITaskPlanItem[];
    boards?: UIBoardPlanItem[];
}

/** Request body for POST /api/ai/plan */
export interface AIPlanRequest {
    description: string;
    scale: 'board' | 'project';
    boardId?: string;            // required for board mode (access check)
    workspaceSlug: string;
    deadline?: string;           // ISO-8601 date string
    contextLinks?: string[];
    maxTasksPerBoard?: number;   // 1-20, default 10
}

/** The confirmed plan sent to createFromAIPlan server action */
export interface ConfirmedPlan {
    type: 'board' | 'project';
    tasks?: TaskPlanItem[];
    boards?: BoardPlanItem[];
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/ai-plan.ts
git commit -m "feat(ai-plan): add shared TypeScript types for multi-scale planning"
```

---

## Task 2: LLM Layer — Prompts and Client Method

**Files:**
- Create: `lib/llm/project-planner.ts`
- Modify: `lib/llm/types.ts` (add 3 new interfaces)
- Modify: `lib/llm/client.ts` (add `planProject()` method)

- [ ] **Step 1: Add LLM types to `lib/llm/types.ts`**

Append after the existing `MinimaxConfig` interface:

```typescript
// Append to lib/llm/types.ts

export interface ProjectPlanRequest {
    description: string;
    scale: 'board' | 'project';
    deadline?: string;
    contextLinks?: string[];
    maxTasksPerBoard?: number;
}

export interface LLMTaskPlanItem {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedHours: number;
}

export interface LLMBoardPlanItem {
    name: string;
    description: string;
    tasks: LLMTaskPlanItem[];
}

export interface ProjectPlanResponse {
    title: string;
    summary: string;
    tasks?: LLMTaskPlanItem[];    // board mode
    boards?: LLMBoardPlanItem[];  // project mode
}
```

Note: The LLM returns priority as `'High'|'Medium'|'Low'` (title-case, matching `SubTask`). The API route normalises to `'HIGH'|'MEDIUM'|'LOW'` before returning to the client.

- [ ] **Step 2: Create `lib/llm/project-planner.ts`**

```typescript
// lib/llm/project-planner.ts
import { ProjectPlanRequest } from './types';

export const BOARD_PLAN_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, generate a flat list of tasks to accomplish it.

Output valid JSON only — no markdown, no explanation:
{
  "title": "short project title (≤60 chars)",
  "summary": "one-sentence overview",
  "tasks": [
    {
      "title": "task title (≤80 chars)",
      "description": "what to do and how (≤300 chars)",
      "priority": "High|Medium|Low",
      "estimatedHours": <number>
    }
  ]
}

Rules:
- 5-15 tasks (or up to maxTasksPerBoard if specified)
- Order tasks logically (dependencies first)
- Titles are imperative: "Build the homepage", not "Homepage"
- estimatedHours is a realistic integer 1-24
- Respond ONLY with valid JSON`;

export const PROJECT_PLAN_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, create a multi-board project plan where each board is a major workstream or phase.

Output valid JSON only — no markdown, no explanation:
{
  "title": "project title (≤60 chars)",
  "summary": "one-sentence overview",
  "boards": [
    {
      "name": "Board Name (≤40 chars)",
      "description": "what this workstream covers (≤120 chars)",
      "tasks": [
        {
          "title": "task title (≤80 chars)",
          "description": "what to do and how (≤300 chars)",
          "priority": "High|Medium|Low",
          "estimatedHours": <number>
        }
      ]
    }
  ]
}

Rules:
- 2-6 boards max (workstreams like Design, Development, Marketing, QA, Launch)
- 3-10 tasks per board (or up to maxTasksPerBoard if specified)
- Board names are clear workstream labels
- Tasks are specific and actionable
- estimatedHours is a realistic integer 1-24
- Respond ONLY with valid JSON`;

export function buildProjectPlanUserPrompt(req: ProjectPlanRequest): string {
    let prompt = `Project description:\n${req.description}\n\n`;

    if (req.deadline) {
        prompt += `Target completion date: ${req.deadline}\n\n`;
    }

    if (req.contextLinks && req.contextLinks.length > 0) {
        prompt += `Reference links:\n${req.contextLinks.map(l => `- ${l}`).join('\n')}\n\n`;
    }

    if (req.maxTasksPerBoard) {
        prompt += `Maximum tasks per board: ${req.maxTasksPerBoard}\n\n`;
    }

    prompt += `Generate a ${req.scale === 'project' ? 'multi-board project plan' : 'task list'} for this.`;
    return prompt;
}
```

- [ ] **Step 3: Add `planProject()` to `lib/llm/client.ts`**

Add the following import at the top of `client.ts`:

```typescript
import { ProjectPlanRequest, ProjectPlanResponse } from './types';
import {
    BOARD_PLAN_SYSTEM_PROMPT,
    PROJECT_PLAN_SYSTEM_PROMPT,
    buildProjectPlanUserPrompt,
} from './project-planner';
```

Add this method inside the `MinimaxClient` class, after `decomposesTask()`:

```typescript
async planProject(request: ProjectPlanRequest): Promise<ProjectPlanResponse> {
    const systemPrompt =
        request.scale === 'project'
            ? PROJECT_PLAN_SYSTEM_PROMPT
            : BOARD_PLAN_SYSTEM_PROMPT;

    const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildProjectPlanUserPrompt(request) },
    ];

    const llmResponse = await this.callAPI(messages);
    return this.parseProjectPlanResponse(llmResponse, request.scale);
}

private parseProjectPlanResponse(
    response: LLMResponse,
    scale: 'board' | 'project'
): ProjectPlanResponse {
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in LLM response');

    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    let parsed: ProjectPlanResponse;
    try {
        parsed = JSON.parse(jsonStr) as ProjectPlanResponse;
    } catch {
        throw new Error('Failed to parse LLM response as JSON');
    }

    if (!parsed.title) throw new Error('Plan missing required field: title');
    if (!parsed.summary) throw new Error('Plan missing required field: summary');

    if (scale === 'board') {
        if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
            throw new Error('Board plan missing tasks array');
        }
        for (const t of parsed.tasks) {
            if (!t.title || !t.description || !t.priority || !t.estimatedHours) {
                throw new Error('Task missing required fields');
            }
        }
    } else {
        if (!parsed.boards || !Array.isArray(parsed.boards) || parsed.boards.length === 0) {
            throw new Error('Project plan missing boards array');
        }
        for (const b of parsed.boards) {
            if (!b.name || !b.description || !Array.isArray(b.tasks)) {
                throw new Error('Board missing required fields');
            }
        }
    }

    return parsed;
}
```

- [ ] **Step 4: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/llm/types.ts lib/llm/project-planner.ts lib/llm/client.ts
git commit -m "feat(ai-plan): add project planning LLM prompts and client method"
```

---

## Task 3: API Endpoint — `/api/ai/plan`

**Files:**
- Create: `app/api/ai/plan/route.ts`

This endpoint calls the LLM and returns the plan. No DB writes. Auth required (session or API key via existing `auth()`).

- [ ] **Step 1: Create `app/api/ai/plan/route.ts`**

```typescript
// app/api/ai/plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { isWorkspaceMember } from '@/lib/workspace-utils';
import { createMinimaxClient } from '@/lib/llm/client';
import type { AIPlanRequest, AIPlan } from '@/types/ai-plan';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let body: AIPlanRequest;
    try {
        body = await request.json() as AIPlanRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { description, scale, boardId, workspaceSlug, deadline, contextLinks, maxTasksPerBoard } = body;

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
        return NextResponse.json(
            { error: 'description must be at least 10 characters' },
            { status: 400 }
        );
    }
    if (scale !== 'board' && scale !== 'project') {
        return NextResponse.json({ error: 'scale must be "board" or "project"' }, { status: 400 });
    }
    if (!workspaceSlug) {
        return NextResponse.json({ error: 'workspaceSlug is required' }, { status: 400 });
    }
    if (scale === 'board' && !boardId) {
        return NextResponse.json({ error: 'boardId is required for board scale' }, { status: 400 });
    }

    await connectDB();

    // Verify workspace membership
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For board scale, verify the board exists in this workspace
    if (scale === 'board' && boardId) {
        const board = await Board.findOne({ _id: boardId, workspaceId: workspace._id });
        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }
    }

    try {
        const client = createMinimaxClient();
        const llmResult = await client.planProject({
            description: description.trim(),
            scale,
            deadline,
            contextLinks,
            maxTasksPerBoard: maxTasksPerBoard ?? 10,
        });

        // Normalise priority from title-case (LLM output) to uppercase (app convention)
        const normalisePriority = (p: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
            const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
                Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH',
                low: 'LOW', medium: 'MEDIUM', high: 'HIGH',
                LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH',
            };
            return map[p] ?? 'MEDIUM';
        };

        const plan: AIPlan = {
            type: scale,
            title: llmResult.title,
            summary: llmResult.summary,
        };

        if (scale === 'board' && llmResult.tasks) {
            plan.tasks = llmResult.tasks.map(t => ({
                title: t.title,
                description: t.description,
                priority: normalisePriority(t.priority),
                estimatedHours: t.estimatedHours,
            }));
        } else if (scale === 'project' && llmResult.boards) {
            plan.boards = llmResult.boards.map(b => ({
                name: b.name,
                description: b.description,
                tasks: b.tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    priority: normalisePriority(t.priority),
                    estimatedHours: t.estimatedHours,
                })),
            }));
        }

        return NextResponse.json(plan);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Planning failed';
        if (msg.includes('timed out')) {
            return NextResponse.json({ error: 'Request timed out — please try again' }, { status: 504 });
        }
        return NextResponse.json({ error: msg }, { status: 502 });
    }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/ai/plan/route.ts
git commit -m "feat(ai-plan): add /api/ai/plan endpoint for dry-run project planning"
```

---

## Task 4: Server Action — Bulk Creation

**Files:**
- Create: `actions/ai-plan.ts`

This server action creates boards and tasks from a confirmed `ConfirmedPlan`. It reuses `createBoard` from `actions/board.ts` for board creation (preserves plan-limit checks, slug generation, webhooks). Tasks are created directly via Mongoose to avoid N redundant auth calls.

- [ ] **Step 1: Read the `createBoard` return type**

Open `actions/board.ts` and note the return value of `createBoard` — it returns `{ id, name, slug, description, color, createdAt }`. The `slug` field is what we need to call `createTask`.

- [ ] **Step 2: Create `actions/ai-plan.ts`**

```typescript
// actions/ai-plan.ts
'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { createBoard } from '@/actions/board';
import type { ConfirmedPlan, TaskPlanItem } from '@/types/ai-plan';

async function insertTasksForBoard(
    workspaceId: Types.ObjectId,
    boardId: Types.ObjectId,
    tasks: TaskPlanItem[]
): Promise<void> {
    const docs = tasks.map((t, index) => ({
        workspaceId,
        boardId,
        title: t.title,
        description: t.description,
        status: 'BACKLOG' as const,
        priority: t.priority,
        order: index,
    }));
    await Task.insertMany(docs);
}

export async function createFromAIPlan(
    workspaceSlug: string,
    boardSlug: string,       // current board slug (used for board-mode and for revalidation)
    boardId: string,         // current board MongoDB id (used for board-mode task insertion)
    plan: ConfirmedPlan
): Promise<{ success: boolean; boardsCreated: number; tasksCreated: number; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Unauthorized' };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Workspace not found' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Permission denied' };
    }

    let boardsCreated = 0;
    let tasksCreated = 0;

    try {
        if (plan.type === 'board' && plan.tasks && plan.tasks.length > 0) {
            // Board mode: insert tasks into the existing current board
            const boardObjectId = new Types.ObjectId(boardId);
            await insertTasksForBoard(workspace._id as Types.ObjectId, boardObjectId, plan.tasks);
            tasksCreated = plan.tasks.length;
            revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        } else if (plan.type === 'project' && plan.boards && plan.boards.length > 0) {
            // Project mode: create each board, then insert its tasks
            for (const boardPlan of plan.boards) {
                // createBoard handles plan-limit check, slug gen, webhook
                const newBoard = await createBoard(workspaceSlug, {
                    name: boardPlan.name,
                    description: boardPlan.description,
                });
                boardsCreated++;

                if (boardPlan.tasks && boardPlan.tasks.length > 0) {
                    const newBoardDoc = await Board.findById(newBoard.id).select('_id');
                    if (newBoardDoc) {
                        await insertTasksForBoard(
                            workspace._id as Types.ObjectId,
                            newBoardDoc._id as Types.ObjectId,
                            boardPlan.tasks
                        );
                        tasksCreated += boardPlan.tasks.length;
                    }
                }
            }
            revalidatePath(`/${workspaceSlug}`);
        }

        return { success: true, boardsCreated, tasksCreated };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Creation failed';
        return { success: false, boardsCreated, tasksCreated, error: msg };
    }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add actions/ai-plan.ts
git commit -m "feat(ai-plan): add createFromAIPlan server action for bulk board+task creation"
```

---

## Task 5: PlanWithAIModal Component

**Files:**
- Create: `components/board/plan-with-ai-modal.tsx`

This is the core UI — a 6-step wizard. Each step is a named `PlanStep` union. The component manages all state locally, calls `/api/ai/plan` to generate the plan, shows a review screen, then calls `createFromAIPlan` to confirm.

- [ ] **Step 1: Create `components/board/plan-with-ai-modal.tsx`**

```typescript
// components/board/plan-with-ai-modal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    XMarkIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    Square2StackIcon,
    TableCellsIcon,
    ArrowUturnLeftIcon,
    CalendarIcon,
    LinkIcon,
} from '@heroicons/react/24/outline';
import { createFromAIPlan } from '@/actions/ai-plan';
import type {
    AIPlanRequest,
    AIPlan,
    UIAIPlan,
    UITaskPlanItem,
    UIBoardPlanItem,
} from '@/types/ai-plan';

type PlanStep = 'scope' | 'input' | 'planning' | 'review' | 'creating' | 'done';

interface PlanWithAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardSlug: string;
    boardName: string;
    workspaceSlug: string;
}

// Converts a raw AIPlan from the API into a UIAIPlan with checkbox state
function toUIPlan(plan: AIPlan): UIAIPlan {
    return {
        type: plan.type,
        title: plan.title,
        summary: plan.summary,
        tasks: plan.tasks?.map(t => ({ ...t, selected: true })),
        boards: plan.boards?.map(b => ({
            ...b,
            selected: true,
            expanded: true,
            tasks: b.tasks.map(t => ({ ...t, selected: true })),
        })),
    };
}

const PRIORITY_STYLES: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

export function PlanWithAIModal({
    isOpen,
    onClose,
    boardId,
    boardSlug,
    boardName,
    workspaceSlug,
}: PlanWithAIModalProps) {
    const router = useRouter();

    // Wizard state
    const [step, setStep] = useState<PlanStep>('scope');
    const [scale, setScale] = useState<'board' | 'project'>('board');

    // Input step state
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [contextLinks, setContextLinks] = useState('');
    const [maxTasksPerBoard, setMaxTasksPerBoard] = useState('');

    // Plan state
    const [uiPlan, setUiPlan] = useState<UIAIPlan | null>(null);
    const [cyclingIndex, setCyclingIndex] = useState(0);
    const [error, setError] = useState('');
    const [creationResult, setCreationResult] = useState<{
        boardsCreated: number;
        tasksCreated: number;
    } | null>(null);

    const cyclingMessages = [
        'Analysing your project...',
        'Identifying workstreams...',
        'Planning tasks...',
        'Estimating effort...',
        'Structuring the plan...',
    ];

    const handleReset = () => {
        setStep('scope');
        setScale('board');
        setDescription('');
        setDeadline('');
        setContextLinks('');
        setMaxTasksPerBoard('');
        setUiPlan(null);
        setError('');
        setCreationResult(null);
        setCyclingIndex(0);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Step: scope → input
    const handleScopeNext = () => setStep('input');

    // Step: input → planning (call /api/ai/plan)
    const handleGenerate = async () => {
        if (!description.trim()) return;
        setStep('planning');
        setError('');

        const interval = setInterval(
            () => setCyclingIndex(i => (i + 1) % cyclingMessages.length),
            1500
        );

        try {
            const links = contextLinks
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .slice(0, 5);

            const body: AIPlanRequest = {
                description: description.trim(),
                scale,
                boardId: scale === 'board' ? boardId : undefined,
                workspaceSlug,
                deadline: deadline || undefined,
                contextLinks: links.length > 0 ? links : undefined,
                maxTasksPerBoard: maxTasksPerBoard ? parseInt(maxTasksPerBoard, 10) : 10,
            };

            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Planning failed');
            }

            const plan = await res.json() as AIPlan;
            setUiPlan(toUIPlan(plan));
            setStep('review');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setStep('input');
        } finally {
            clearInterval(interval);
        }
    };

    // Review helpers — board tasks
    const toggleTask = (taskIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.tasks) return prev;
            const tasks = prev.tasks.map((t, i) =>
                i === taskIndex ? { ...t, selected: !t.selected } : t
            );
            return { ...prev, tasks };
        });
    };

    // Review helpers — project boards
    const toggleBoard = (boardIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            const boards = prev.boards.map((b, i) => {
                if (i !== boardIndex) return b;
                const selected = !b.selected;
                return {
                    ...b,
                    selected,
                    tasks: b.tasks.map(t => ({ ...t, selected })),
                };
            });
            return { ...prev, boards };
        });
    };

    const toggleBoardTask = (boardIndex: number, taskIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            const boards = prev.boards.map((b, bi) => {
                if (bi !== boardIndex) return b;
                const tasks = b.tasks.map((t, ti) =>
                    ti === taskIndex ? { ...t, selected: !t.selected } : t
                );
                const anySelected = tasks.some(t => t.selected);
                return { ...b, tasks, selected: anySelected };
            });
            return { ...prev, boards };
        });
    };

    const toggleBoardExpanded = (boardIndex: number) => {
        setUiPlan(prev => {
            if (!prev?.boards) return prev;
            const boards = prev.boards.map((b, i) =>
                i === boardIndex ? { ...b, expanded: !b.expanded } : b
            );
            return { ...prev, boards };
        });
    };

    // Step: review → creating
    const handleConfirm = async () => {
        if (!uiPlan) return;
        setStep('creating');

        try {
            let confirmedTasks;
            let confirmedBoards;

            if (uiPlan.type === 'board') {
                confirmedTasks = (uiPlan.tasks ?? [])
                    .filter((t): t is UITaskPlanItem => t.selected)
                    .map(({ selected: _s, ...rest }) => rest);
            } else {
                confirmedBoards = (uiPlan.boards ?? [])
                    .filter(b => b.selected)
                    .map(b => ({
                        name: b.name,
                        description: b.description,
                        tasks: b.tasks
                            .filter(t => t.selected)
                            .map(({ selected: _s, ...rest }) => rest),
                    }));
            }

            const result = await createFromAIPlan(workspaceSlug, boardSlug, boardId, {
                type: uiPlan.type,
                tasks: confirmedTasks,
                boards: confirmedBoards,
            });

            if (!result.success) {
                setError(result.error ?? 'Creation failed');
                setStep('review');
                return;
            }

            setCreationResult({
                boardsCreated: result.boardsCreated,
                tasksCreated: result.tasksCreated,
            });
            setStep('done');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Creation failed');
            setStep('review');
        }
    };

    const selectedCount =
        uiPlan?.type === 'board'
            ? (uiPlan.tasks ?? []).filter(t => t.selected).length
            : (uiPlan?.boards ?? []).reduce(
                  (acc, b) => acc + b.tasks.filter(t => t.selected).length,
                  0
              );

    const selectedBoardCount = (uiPlan?.boards ?? []).filter(b => b.selected).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={step === 'planning' || step === 'creating' ? undefined : handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-4 sm:inset-0 sm:m-auto w-auto sm:max-w-2xl h-fit max-h-[90vh] overflow-hidden bg-[var(--surface)] rounded-2xl shadow-2xl z-50 border border-[var(--border-subtle)]"
                    >
                        {/* Header */}
                        <div className="relative px-4 md:px-6 py-4 md:py-5 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-primary)]/5 to-purple-500/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--foreground)]">Plan with AI</h2>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {step === 'scope' && 'Choose the scale of your plan'}
                                            {step === 'input' && 'Describe what you want to build'}
                                            {step === 'planning' && 'Generating your plan...'}
                                            {step === 'review' && 'Review and edit your plan'}
                                            {step === 'creating' && 'Creating your project...'}
                                            {step === 'done' && 'Your plan is ready'}
                                        </p>
                                    </div>
                                </div>
                                {step !== 'planning' && step !== 'creating' && (
                                    <button
                                        onClick={handleClose}
                                        aria-label="Close"
                                        className="p-2.5 rounded-xl hover:bg-[var(--background-subtle)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 md:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

                            {/* ── Step: scope ── */}
                            {step === 'scope' && (
                                <div className="space-y-5">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        What are you planning?
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setScale('board')}
                                            className={`p-5 rounded-xl border-2 text-left transition-all ${
                                                scale === 'board'
                                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                                                    : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'
                                            }`}
                                        >
                                            <TableCellsIcon className="w-8 h-8 text-[var(--brand-primary)] mb-3" />
                                            <h3 className="font-bold text-[var(--foreground)] mb-1">This board</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                Generate tasks for <span className="font-medium">{boardName}</span>
                                            </p>
                                        </button>
                                        <button
                                            onClick={() => setScale('project')}
                                            className={`p-5 rounded-xl border-2 text-left transition-all ${
                                                scale === 'project'
                                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                                                    : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'
                                            }`}
                                        >
                                            <Square2StackIcon className="w-8 h-8 text-purple-500 mb-3" />
                                            <h3 className="font-bold text-[var(--foreground)] mb-1">Full project</h3>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                Generate multiple boards with tasks — for bigger plans
                                            </p>
                                        </button>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleScopeNext}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 transition-all"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                        Continue
                                    </motion.button>
                                </div>
                            )}

                            {/* ── Step: input ── */}
                            {step === 'input' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            What are you building? <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder={
                                                scale === 'board'
                                                    ? 'e.g., Build a restaurant website for a client in Lagos — homepage, menu, booking form, contact page'
                                                    : 'e.g., Launch a SaaS task management product — design, frontend, backend, marketing, and launch'
                                            }
                                            className="input text-base md:text-sm min-h-[100px] resize-none"
                                            maxLength={1000}
                                            autoFocus
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            The more specific you are, the better the plan.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <CalendarIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Deadline <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            className="input text-base md:text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <LinkIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Context links <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            value={contextLinks}
                                            onChange={e => setContextLinks(e.target.value)}
                                            placeholder={'https://docs.example.com\nhttps://github.com/...'}
                                            className="input text-base md:text-sm min-h-[60px] resize-none"
                                        />
                                        <p className="text-xs text-[var(--text-tertiary)]">One URL per line, max 5.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                            <SparklesIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                                            Max tasks {scale === 'project' ? 'per board ' : ''}
                                            <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={maxTasksPerBoard}
                                            onChange={e => setMaxTasksPerBoard(e.target.value)}
                                            placeholder="Leave empty for default (10)"
                                            className="input text-base md:text-sm"
                                            min={1}
                                            max={20}
                                        />
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                        >
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setStep('scope')}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--background-subtle)] transition-colors"
                                        >
                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                            Back
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={handleGenerate}
                                            disabled={!description.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <SparklesIcon className="w-5 h-5" />
                                            Generate plan
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step: planning ── */}
                            {step === 'planning' && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <p className="text-base font-semibold text-[var(--foreground)]">
                                        {cyclingMessages[cyclingIndex]}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">This usually takes 5-15 seconds.</p>
                                </div>
                            )}

                            {/* ── Step: review ── */}
                            {step === 'review' && uiPlan && (
                                <div className="space-y-4">
                                    {/* Plan summary */}
                                    <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                                        <p className="font-semibold text-[var(--foreground)]">{uiPlan.title}</p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">{uiPlan.summary}</p>
                                    </div>

                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                                        </div>
                                    )}

                                    {/* Board mode: flat task list */}
                                    {uiPlan.type === 'board' && uiPlan.tasks && (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {uiPlan.tasks.map((task, i) => (
                                                <label
                                                    key={i}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={task.selected}
                                                        onChange={() => toggleTask(i)}
                                                        className="mt-0.5 accent-[var(--brand-primary)]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-sm font-medium ${task.selected ? 'text-[var(--foreground)]' : 'text-[var(--text-tertiary)] line-through'}`}>
                                                                {task.title}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-xs text-[var(--text-tertiary)]">~{task.estimatedHours}h</span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{task.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Project mode: board tree */}
                                    {uiPlan.type === 'project' && uiPlan.boards && (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {uiPlan.boards.map((board, bi) => (
                                                <div
                                                    key={bi}
                                                    className={`rounded-xl border-2 transition-all ${
                                                        board.selected
                                                            ? 'border-[var(--brand-primary)]/30'
                                                            : 'border-[var(--border-subtle)] opacity-60'
                                                    }`}
                                                >
                                                    {/* Board header */}
                                                    <div className="flex items-center gap-3 p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={board.selected}
                                                            onChange={() => toggleBoard(bi)}
                                                            className="accent-[var(--brand-primary)]"
                                                        />
                                                        <button
                                                            onClick={() => toggleBoardExpanded(bi)}
                                                            className="flex items-center gap-2 flex-1 text-left"
                                                        >
                                                            {board.expanded
                                                                ? <ChevronDownIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                                                                : <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                                                            }
                                                            <span className="font-semibold text-sm text-[var(--foreground)]">{board.name}</span>
                                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                                {board.tasks.filter(t => t.selected).length}/{board.tasks.length} tasks
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {/* Tasks */}
                                                    {board.expanded && (
                                                        <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-subtle)] pt-2">
                                                            {board.tasks.map((task, ti) => (
                                                                <label
                                                                    key={ti}
                                                                    className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--background)] cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={task.selected}
                                                                        onChange={() => toggleBoardTask(bi, ti)}
                                                                        className="mt-0.5 accent-[var(--brand-primary)]"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className={`text-sm ${task.selected ? 'text-[var(--foreground)]' : 'text-[var(--text-tertiary)] line-through'}`}>
                                                                                {task.title}
                                                                            </span>
                                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority]}`}>
                                                                                {task.priority}
                                                                            </span>
                                                                            <span className="text-xs text-[var(--text-tertiary)]">~{task.estimatedHours}h</span>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Review actions */}
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {uiPlan.type === 'board'
                                            ? `${selectedCount} task${selectedCount !== 1 ? 's' : ''} selected`
                                            : `${selectedBoardCount} board${selectedBoardCount !== 1 ? 's' : ''}, ${selectedCount} task${selectedCount !== 1 ? 's' : ''} selected`
                                        }
                                    </p>

                                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                                        <button
                                            onClick={() => setStep('input')}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--background-subtle)] transition-colors"
                                        >
                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                            Start over
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={handleConfirm}
                                            disabled={selectedCount === 0}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-[var(--brand-primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {uiPlan.type === 'board'
                                                ? `Create ${selectedCount} task${selectedCount !== 1 ? 's' : ''}`
                                                : `Create ${selectedBoardCount} board${selectedBoardCount !== 1 ? 's' : ''} + ${selectedCount} tasks`
                                            }
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step: creating ── */}
                            {step === 'creating' && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                                        <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <p className="text-base font-semibold text-[var(--foreground)]">Creating your project...</p>
                                </div>
                            )}

                            {/* ── Step: done ── */}
                            {step === 'done' && creationResult && (
                                <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircleIcon className="w-9 h-9 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-[var(--foreground)]">Done!</p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {creationResult.boardsCreated > 0 && (
                                                <>{creationResult.boardsCreated} board{creationResult.boardsCreated !== 1 ? 's' : ''} and </>
                                            )}
                                            {creationResult.tasksCreated} task{creationResult.tasksCreated !== 1 ? 's' : ''} created.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors"
                                    >
                                        View board
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/board/plan-with-ai-modal.tsx
git commit -m "feat(ai-plan): add PlanWithAIModal multi-step wizard component"
```

---

## Task 6: Wire PlanWithAIModal into board.tsx

**Files:**
- Modify: `components/board/board.tsx`

Replace `AIDecomposeModal` with `PlanWithAIModal`. Pass the new required props: `boardSlug` and `boardName` (already available in the `Board` component scope).

- [ ] **Step 1: Update imports in `board.tsx`**

Find:
```typescript
import { AIDecomposeModal } from './ai-decompose-modal';
```

Replace with:
```typescript
import { PlanWithAIModal } from './plan-with-ai-modal';
```

- [ ] **Step 2: Replace the modal state variable name**

Find:
```typescript
const [showAIDecomposeModal, setShowAIDecomposeModal] = useState(false);
```

Replace with:
```typescript
const [showPlanWithAI, setShowPlanWithAI] = useState(false);
```

- [ ] **Step 3: Update the toolbar button to use the new state**

Find:
```tsx
onClick={() => setShowAIDecomposeModal(true)}
```

Replace with:
```tsx
onClick={() => setShowPlanWithAI(true)}
```

- [ ] **Step 4: Update the empty state button to use the new state**

Find the empty state card (added in the previous "Plan with AI" implementation):
```tsx
onClick={() => setShowAIDecomposeModal(true)}
```

Replace with:
```tsx
onClick={() => setShowPlanWithAI(true)}
```

- [ ] **Step 5: Replace the modal JSX**

Find:
```tsx
<AIDecomposeModal
    isOpen={showAIDecomposeModal}
    onClose={() => setShowAIDecomposeModal(false)}
    onSubmit={handleCreateTaskFromAI}
    boardId={boardId || ''}
/>
```

Replace with:
```tsx
<PlanWithAIModal
    isOpen={showPlanWithAI}
    onClose={() => setShowPlanWithAI(false)}
    boardId={boardId || ''}
    boardSlug={boardSlug || ''}
    boardName={boardName}
    workspaceSlug={workspaceSlug}
/>
```

Note: `handleCreateTaskFromAI` is no longer needed by the modal (creation is handled inside the action). Verify it is not used elsewhere before removing it. If it is used elsewhere, leave it. If it is only used by the old modal's `onSubmit`, remove it.

- [ ] **Step 6: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint components/board/board.tsx
```

Expected: no errors.

- [ ] **Step 7: Delete the old modal**

```bash
git rm components/board/ai-decompose-modal.tsx
```

- [ ] **Step 8: Commit**

```bash
git add components/board/board.tsx
git commit -m "feat(ai-plan): wire PlanWithAIModal into board view, remove AIDecomposeModal"
```

---

## Task 7: Production Build Gate

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 2: Lint changed files**

```bash
npx eslint types/ai-plan.ts lib/llm/project-planner.ts lib/llm/client.ts lib/llm/types.ts app/api/ai/plan/route.ts actions/ai-plan.ts components/board/plan-with-ai-modal.tsx components/board/board.tsx
```

Expected: 0 errors (warnings are acceptable).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with all routes listed. The new `app/api/ai/plan` route should appear as a dynamic route `ƒ`.

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "feat(ai-plan): complete multi-scale Plan with AI wizard — boards + tasks generation with review step"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Unified "Plan with AI" entry point (replaces AIDecomposeModal)
- ✅ Scale selection: board mode vs project mode
- ✅ Review step before any DB writes
- ✅ Board generation (project mode creates new boards in workspace)
- ✅ Task generation on existing board (board mode)
- ✅ Checkbox selection in review (user can deselect unwanted items)
- ✅ Deadline input threads through to LLM prompt
- ✅ `router.refresh()` after creation updates the board view without full reload
- ✅ Old `/api/v1/tasks/decompose` endpoint preserved (not touched)
- ✅ Plan limit enforced via existing `createBoard` reuse
- ✅ Auth enforced in both API route and server action

**Type consistency:**
- `TaskPlanItem` defined in `types/ai-plan.ts`, used in `actions/ai-plan.ts`, `app/api/ai/plan/route.ts`, and modal
- `UITaskPlanItem extends TaskPlanItem` — `selected` field stripped before passing to server action
- `ConfirmedPlan.type` drives branch in `createFromAIPlan` — consistent with `AIPlan.type`
- Priority normalisation: LLM returns title-case → API normalises to uppercase → `Task` model accepts uppercase

**No placeholders:** All steps contain complete code. No "TBD" or "similar to above."
