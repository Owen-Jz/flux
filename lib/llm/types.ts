export interface DecomposeRequest {
  taskTitle: string;
  taskDescription: string;
  contextLinks?: string[];
  requestedCompletionDate?: string;
  maxSubtasks?: number;
}

export interface SubTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High';
  referenceUrls?: string[];
}

export interface DecomposeResponse {
  taskId: string;
  summary: string;
  subtasks: SubTask[];
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface MinimaxConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

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
