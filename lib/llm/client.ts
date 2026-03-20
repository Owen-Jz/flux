import { DecomposeRequest, DecomposeResponse, LLMMessage, LLMResponse, MinimaxConfig } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { randomUUID } from 'crypto';

export class MinimaxClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: MinimaxConfig) {
    if (!config.apiKey) {
      throw new Error('Minimax API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.minimax.io/v1';
    this.model = config.model || 'MiniMax-M2.5';
  }

  async decomposesTask(request: DecomposeRequest): Promise<DecomposeResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(request) }
    ];

    const response = await this.callAPI(messages);
    return this.parseResponse(response);
  }

  async callAPI(messages: LLMMessage[]): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Minimax API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as LLMResponse;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      throw error;
    }
  }

  parseResponse(response: LLMResponse): DecomposeResponse {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Extract JSON from markdown code blocks if present
    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr) as DecomposeResponse;

      // Validate the parsed response
      if (!parsed.taskId) {
        parsed.taskId = randomUUID();
      }
      if (!parsed.summary) {
        throw new Error('Response missing required field: summary');
      }
      if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
        throw new Error('Response missing required field: subtasks');
      }

      // Validate subtasks
      for (const subtask of parsed.subtasks) {
        if (!subtask.title || !subtask.description || !subtask.estimatedHours || !subtask.priority) {
          throw new Error('Subtask missing required fields');
        }
        if (!['Low', 'Medium', 'High'].includes(subtask.priority)) {
          throw new Error('Invalid priority value');
        }
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse LLM response as JSON');
      }
      throw error;
    }
  }
}

export function createMinimaxClient(): MinimaxClient {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY environment variable is required');
  }

  return new MinimaxClient({
    apiKey,
    baseUrl: process.env.MINIMAX_BASE_URL,
    model: process.env.MINIMAX_MODEL
  });
}
