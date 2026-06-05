import { DecomposeRequest, DecomposeResponse, LLMMessage, LLMResponse, MinimaxConfig, ProjectPlanRequest, ProjectPlanResponse } from './types';
import type { BoardSkeletonResponse, SectionTasksResponse } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import {
  BOARD_PLAN_SYSTEM_PROMPT,
  PROJECT_PLAN_SYSTEM_PROMPT,
  buildProjectPlanUserPrompt,
  parseProjectPlanResponse,
} from './project-planner';
import {
  SKELETON_SYSTEM_PROMPT,
  SECTION_SYSTEM_PROMPT,
  buildSkeletonUserPrompt,
  buildSectionUserPrompt,
  parseSkeletonResponse,
  parseSectionResponse,
  extractJsonString,
  type SkeletonPromptInput,
  type SectionPromptInput,
} from './board-stream-planner';
import { randomUUID } from 'crypto';

/**
 * Per-attempt network timeout. Applied FRESH on every retry (via a new
 * AbortController each attempt) so a slow attempt can never poison the next one.
 */
const ATTEMPT_TIMEOUT_MS = 24000;

/** Tuning knobs passed per call so each planning phase gets a right-sized budget. */
interface CallOptions {
  /** Hard cap on generated tokens — bounds worst-case latency without truncating realistic plans. */
  maxTokens?: number;
  /** Lower temperature = more deterministic, faster, more reliably-parseable JSON. */
  temperature?: number;
}

/** Carries the HTTP status so retry logic can distinguish transient from permanent failures. */
class MinimaxApiError extends Error {
  constructor(public readonly status: number, body: string) {
    super(`Minimax API error: ${status}${body ? ` - ${body}` : ''}`);
    this.name = 'MinimaxApiError';
  }
}

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

    const response = await this.callAPI(messages, { maxTokens: 2048 });
    return this.parseResponse(response);
  }

  async planProject(request: ProjectPlanRequest): Promise<ProjectPlanResponse> {
    const systemPrompt =
      request.scale === 'project'
        ? PROJECT_PLAN_SYSTEM_PROMPT
        : BOARD_PLAN_SYSTEM_PROMPT;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildProjectPlanUserPrompt(request) },
    ];

    // Project plans are multi-board and the largest single generation — give them
    // plenty of headroom so a big plan never truncates mid-JSON.
    const llmResponse = await this.callAPI(messages, {
      maxTokens: request.scale === 'project' ? 8000 : 4000,
    });
    const content = llmResponse.choices[0]?.message?.content ?? '';
    return parseProjectPlanResponse(content, request.scale);
  }

  async planSkeleton(input: SkeletonPromptInput): Promise<BoardSkeletonResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SKELETON_SYSTEM_PROMPT },
      { role: 'user', content: buildSkeletonUserPrompt(input) },
    ];
    // The skeleton is just section names + descriptions — small and fast.
    const response = await this.callAPI(messages, { maxTokens: 1500, temperature: 0.5 });
    const content = response.choices[0]?.message?.content ?? '';
    return parseSkeletonResponse(content);
  }

  async planSection(input: SectionPromptInput): Promise<SectionTasksResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SECTION_SYSTEM_PROMPT },
      { role: 'user', content: buildSectionUserPrompt(input) },
    ];
    // One section's worth of tasks — bounded by perSectionCap upstream.
    const response = await this.callAPI(messages, { maxTokens: 2500 });
    const content = response.choices[0]?.message?.content ?? '';
    return parseSectionResponse(content);
  }

  /** Transient failures worth retrying: rate-limit, overload, 5xx, network, timeout. */
  private isRetryable(error: unknown): boolean {
    if (error instanceof MinimaxApiError) {
      return error.status === 429 || error.status === 529 || error.status >= 500;
    }
    if (error instanceof Error) {
      // Per-attempt timeout (mapped below) or a fetch/network failure (TypeError).
      return error.name === 'TypeError' || error.message.includes('timed out');
    }
    return false;
  }

  private isOverload(error: unknown): boolean {
    if (error instanceof MinimaxApiError) return error.status === 429 || error.status === 529;
    return error instanceof Error && error.message.toLowerCase().includes('overloaded');
  }

  // Retry helper with exponential backoff — only for transient failures. Permanent
  // errors (4xx other than 429, malformed JSON, bad key) fail fast instead of
  // wasting 6s+ of backoff before the inevitable failure.
  private async withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3, baseDelayMs: number = 1500): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt >= maxAttempts || !this.isRetryable(error)) break;

        const delay = this.isOverload(error)
          ? baseDelayMs * Math.pow(3, attempt - 1) // Longer backoff for overload: 1.5s, 4.5s
          : baseDelayMs * Math.pow(2, attempt - 1); // Normal backoff: 1.5s, 3s
        console.log(`LLM API attempt ${attempt} failed (${lastError.message}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async callAPI(messages: LLMMessage[], options: CallOptions = {}): Promise<LLMResponse> {
    // A fresh AbortController + timeout PER ATTEMPT (inside withRetry), so retries
    // after a slow first attempt get a clean clock instead of an already-aborted signal.
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

      try {
        const res = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 2048,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const error = await res.text().catch(() => '');
          throw new MinimaxApiError(res.status, error);
        }

        return (await res.json()) as LLMResponse;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timed out after ${ATTEMPT_TIMEOUT_MS / 1000} seconds`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  parseResponse(response: LLMResponse): DecomposeResponse {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Extract JSON from markdown code blocks if present
    const jsonStr = extractJsonString(content);

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
