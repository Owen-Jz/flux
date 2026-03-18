export interface DecomposeRequest {
  taskTitle: string;
  taskDescription: string;
  contextLinks?: string[];
  requestedCompletionDate?: string;
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
