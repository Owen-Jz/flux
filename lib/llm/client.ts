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

  // Retry helper with exponential backoff for transient failures
  private async withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3, baseDelayMs: number = 2000): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a server overload error (529)
        const isOverload = error instanceof Error &&
          (error.message.includes('529') || error.message.includes('overloaded'));

        if (attempt < maxAttempts) {
          const delay = isOverload
            ? baseDelayMs * Math.pow(3, attempt - 1) // Longer backoff for server overload: 2s, 6s, 18s
            : baseDelayMs * Math.pow(2, attempt - 1); // Normal backoff: 2s, 4s, 8s
          console.log(`LLM API attempt ${attempt} failed (${lastError.message}), retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async callAPI(messages: LLMMessage[]): Promise<LLMResponse> {
    const controller = new AbortController();
    // Increased timeout from 15s to 30s to handle server overload scenarios
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
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

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Minimax API error: ${res.status} - ${error}`);
        }

        return res.json() as Promise<LLMResponse>;
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
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
