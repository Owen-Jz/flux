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
