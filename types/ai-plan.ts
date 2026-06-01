// types/ai-plan.ts

/** Scale of an AI plan — single board or multi-board project */
export type PlanScale = 'board' | 'project';

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
    type: PlanScale;
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
export interface UIAIPlan extends Omit<AIPlan, 'tasks' | 'boards'> {
    tasks?: UITaskPlanItem[];
    boards?: UIBoardPlanItem[];
}

/** Request body for POST /api/ai/plan */
export interface AIPlanRequest {
    description: string;
    scale: PlanScale;
    boardId?: string;            // required for board mode (access check)
    workspaceSlug: string;
    deadline?: string;           // ISO-8601 date string
    contextLinks?: string[];
    maxTasksPerBoard?: number;   // 1-20, default 10
}

/** The confirmed plan sent to createFromAIPlan server action */
export type ConfirmedPlan =
    | { type: 'board';   tasks: TaskPlanItem[] }
    | { type: 'project'; boards: BoardPlanItem[] };

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
