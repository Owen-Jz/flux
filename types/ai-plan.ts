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
