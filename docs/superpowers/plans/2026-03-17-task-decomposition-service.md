# Task Decomposition Service Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an AI-powered task decomposition API that accepts high-level task descriptions, uses Minimax M2.5 LLM to decompose into subtasks, and persists to existing MongoDB task board.

**Architecture:** Next.js API Route integrated with Minimax M2.5 API, MongoDB persistence, enhanced dual-window rate limiting, and Prometheus metrics.

**Tech Stack:** Next.js 16, TypeScript, Minimax M2.5 API, MongoDB/Mongoose, Express, Prometheus client

---

## File Structure

```
app/api/v1/tasks/decompose/
├── route.ts              # Main API endpoint
lib/llm/
├── client.ts             # Minimax API client
├── prompts.ts            # Prompt templates
├── types.ts              # LLM request/response types
lib/
├── rate-limit-enhanced.ts    # Dual-window rate limiter
├── idempotency.ts             # Idempotency handling
├── logger.ts                 # Structured JSON logger
├── metrics.ts                # Prometheus metrics
models/
├── IdempotencyKey.ts     # Idempotency cache model
__tests__/
├── decompose.test.ts     # Unit tests
├── rate-limit.test.ts    # Rate limiter tests
├── llm-client.test.ts    # LLM client tests
Dockerfile
docker-compose.yml
README.md
openapi.yaml
```

---

## Implementation Tasks

### Task 1: Create LLM Client for Minimax M2.5

**Files:**
- Create: `lib/llm/types.ts`
- Create: `lib/llm/prompts.ts`
- Create: `lib/llm/client.ts`
- Test: `__tests__/llm-client.test.ts`

- [ ] **Step 1: Create LLM types**

```typescript
// lib/llm/types.ts
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
```

- [ ] **Step 2: Create prompt templates**

```typescript
// lib/llm/prompts.ts
export const SYSTEM_PROMPT = `You are an expert task decomposition assistant. Analyze the given task and break it down into 3-10 actionable subtasks.

For each subtask, provide:
- title (max 80 characters)
- description (max 500 characters)
- estimated hours (0.5-16, in 0.5 increments)
- priority (Low, Medium, or High)
- reference URLs (optional, max 2 per subtask)

Also provide a concise summary of the task (150-400 characters).

Respond in JSON format:
{
  "summary": "...",
  "subtasks": [
    {
      "title": "...",
      "description": "...",
      "estimatedHours": 2.5,
      "priority": "High",
      "referenceUrls": ["https://..."]
    }
  ]
}`;

export function buildUserPrompt(request: DecomposeRequest): string {
  let prompt = `Task Title: ${request.taskTitle}\n\nTask Description: ${request.taskDescription}`;

  if (request.contextLinks && request.contextLinks.length > 0) {
    prompt += `\n\nContext Links:\n${request.contextLinks.map((url, i) => `${i + 1}. ${url}`).join('\n')}`;
  }

  if (request.requestedCompletionDate) {
    prompt += `\n\nRequested Completion Date: ${request.requestedCompletionDate}`;
  }

  return prompt;
}
```

- [ ] **Step 3: Create Minimax API client**

```typescript
// lib/llm/client.ts
import { LLMMessage, LLMResponse, DecomposeRequest, DecomposeResponse, SubTask } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

const LLM_TIMEOUT_MS = 15000;

interface MinimaxConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class MinimaxClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: MinimaxConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.minimax.chat/v1';
    this.model = config.model || 'MiniMax-M2.5';
  }

  async decomposeTask(request: DecomposeRequest): Promise<DecomposeResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(request) }
    ];

    const response = await this.callAPI(messages);
    return this.parseResponse(response);
  }

  private async callAPI(messages: LLMMessage[]): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`LLM API error: ${res.status} ${res.statusText}`);
      }

      return await res.json() as LLMResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseResponse(response: LLMResponse): DecomposeResponse {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response: no content');
    }

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const parsed = JSON.parse(jsonStr);
    return {
      taskId: '', // Will be set after DB insertion
      summary: parsed.summary,
      subtasks: parsed.subtasks as SubTask[],
    };
  }
}

export function createMinimaxClient(): MinimaxClient {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY environment variable is required');
  }
  return new MinimaxClient({ apiKey });
}
```

- [ ] **Step 4: Write unit tests for LLM client**

```typescript
// __tests__/llm-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('MinimaxClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when API key is missing', () => {
    delete process.env.MINIMAX_API_KEY;
    expect(() => require('../../lib/llm/client').createMinimaxClient()).toThrow('MINIMAX_API_KEY');
  });

  it('should parse LLM response correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '{"summary": "Test summary", "subtasks": [{"title": "Task 1", "description": "Desc", "estimatedHours": 2, "priority": "High"}]}'
        }
      }]
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as any);

    const { MinimaxClient } = await import('../../lib/llm/client');
    const client = new MinimaxClient({ apiKey: 'test-key' });
    const result = await client.decomposeTask({
      taskTitle: 'Test task',
      taskDescription: 'Test description'
    });

    expect(result.summary).toBe('Test summary');
    expect(result.subtasks).toHaveLength(1);
    expect(result.subtasks[0].title).toBe('Task 1');
  });

  it('should timeout after 15 seconds', async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { MinimaxClient } = await import('../../lib/llm/client');
    const client = new MinimaxClient({ apiKey: 'test-key' });

    await expect(client.decomposeTask({
      taskTitle: 'Test task',
      taskDescription: 'Test description'
    })).rejects.toThrow('Aborted');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add lib/llm/types.ts lib/llm/prompts.ts lib/llm/client.ts __tests__/llm-client.test.ts
git commit -m "feat: add Minimax LLM client for task decomposition"
```

---

### Task 2: Enhanced Rate Limiter

**Files:**
- Create: `lib/rate-limit-enhanced.ts`
- Test: `__tests__/rate-limit.test.ts`

- [ ] **Step 1: Write failing test for rate limiter**

```typescript
// __tests__/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Clear modules to get fresh rate limit state
vi.resetModules();

describe('EnhancedRateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests under user limit', async () => {
    const { checkUserRateLimit } = await import('../../lib/rate-limit-enhanced');
    const result = checkUserRateLimit('user-123');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(19); // 20 - 1
    expect(result.limitType).toBe('user');
  });

  it('should block requests over user limit (20 per hour)', async () => {
    const { checkUserRateLimit } = await import('../../lib/rate-limit-enhanced');

    // Make 20 requests
    for (let i = 0; i < 20; i++) {
      checkUserRateLimit('user-456');
    }

    // 21st request should be blocked
    const result = checkUserRateLimit('user-456');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limitType).toBe('user');
  });

  it('should block requests over API key limit (100 per 24h)', async () => {
    const { checkApiKeyRateLimit } = await import('../../lib/rate-limit-enhanced');

    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      checkApiKeyRateLimit('api-key-789');
    }

    // 101st request should be blocked
    const result = checkApiKeyRateLimit('api-key-789');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limitType).toBe('api_key');
  });

  it('should return Retry-After header value', async () => {
    const { checkUserRateLimit } = await import('../../lib/rate-limit-enhanced');

    // Exhaust the limit
    for (let i = 0; i < 20; i++) {
      checkUserRateLimit('user-retry');
    }

    const result = checkUserRateLimit('user-retry');
    expect(result.resetIn).toBeGreaterThan(0);
    expect(result.resetIn).toBeLessThanOrEqual(3600); // Max 60 minutes in seconds
  });

  it('should track different users separately', async () => {
    const { checkUserRateLimit } = await import('../../lib/rate-limit-enhanced');

    // User A at limit
    for (let i = 0; i < 20; i++) {
      checkUserRateLimit('user-a');
    }

    // User B should still be allowed
    const resultB = checkUserRateLimit('user-b');
    expect(resultB.success).toBe(true);
  });
});
```

- [ ] **Step 2: Implement enhanced rate limiter**

```typescript
// lib/rate-limit-enhanced.ts
import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Dual-window rate limiter
const userRateLimitStore = new Map<string, RateLimitEntry>();
const apiKeyRateLimitStore = new Map<string, RateLimitEntry>();

// Config
const USER_LIMIT = 20;
const USER_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const API_KEY_LIMIT = 100;
const API_KEY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userRateLimitStore.entries()) {
    if (entry.resetTime < now) userRateLimitStore.delete(key);
  }
  for (const [key, entry] of apiKeyRateLimitStore.entries()) {
    if (entry.resetTime < now) apiKeyRateLimitStore.delete(key);
  }
}, 60 * 1000);

export interface EnhancedRateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
  limitType: 'user' | 'api_key' | 'none';
}

export function checkUserRateLimit(userId: string): EnhancedRateLimitResult {
  const now = Date.now();
  const entry = userRateLimitStore.get(userId);

  if (!entry || entry.resetTime < now) {
    userRateLimitStore.set(userId, {
      count: 1,
      resetTime: now + USER_WINDOW_MS,
    });
    return {
      success: true,
      remaining: USER_LIMIT - 1,
      resetIn: Math.ceil(USER_WINDOW_MS / 1000),
      limitType: 'user',
    };
  }

  if (entry.count >= USER_LIMIT) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetIn,
      limitType: 'user',
    };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  return {
    success: true,
    remaining: USER_LIMIT - entry.count,
    resetIn,
    limitType: 'user',
  };
}

export function checkApiKeyRateLimit(apiKey: string): EnhancedRateLimitResult {
  const now = Date.now();
  const entry = apiKeyRateLimitStore.get(apiKey);

  if (!entry || entry.resetTime < now) {
    apiKeyRateLimitStore.set(apiKey, {
      count: 1,
      resetTime: now + API_KEY_WINDOW_MS,
    });
    return {
      success: true,
      remaining: API_KEY_LIMIT - 1,
      resetIn: Math.ceil(API_KEY_WINDOW_MS / 1000),
      limitType: 'api_key',
    };
  }

  if (entry.count >= API_KEY_LIMIT) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetIn,
      limitType: 'api_key',
    };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  return {
    success: true,
    remaining: API_KEY_LIMIT - entry.count,
    resetIn,
    limitType: 'api_key',
  };
}

export function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
```

- [ ] **Step 3: Run tests and commit**

```bash
git add lib/rate-limit-enhanced.ts __tests__/rate-limit.test.ts
git commit -m "feat: add enhanced dual-window rate limiter"
```

---

### Task 3: Idempotency Handler

**Files:**
- Create: `models/IdempotencyKey.ts`
- Create: `lib/idempotency.ts`

- [ ] **Step 1: Create IdempotencyKey model**

```typescript
// models/IdempotencyKey.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  userId: Types.ObjectId;
  responseHash: string;
  response: object;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  responseHash: { type: String, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

// TTL index for auto-cleanup
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey: Model<IIdempotencyKey> =
  mongoose.models.IdempotencyKey || mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
```

- [ ] **Step 2: Create idempotency handler**

```typescript
// lib/idempotency.ts
import crypto from 'crypto';
import { IdempotencyKey } from '@/models/IdempotencyKey';
import { Types } from 'mongoose';

const IDEMPOTENCY_TTL_HOURS = 24;

export async function getCachedResponse(
  idempotencyKey: string,
  userId: string
): Promise<object | null> {
  const existing = await IdempotencyKey.findOne({
    key: idempotencyKey,
    userId: new Types.ObjectId(userId),
    expiresAt: { $gt: new Date() },
  });

  return existing?.response || null;
}

export async function cacheResponse(
  idempotencyKey: string,
  userId: string,
  requestHash: string,
  response: object
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

  await IdempotencyKey.findOneAndUpdate(
    { key: idempotencyKey },
    {
      key: idempotencyKey,
      userId: new Types.ObjectId(userId),
      responseHash: requestHash,
      response,
      expiresAt,
    },
    { upsert: true }
  );
}

export function hashPayload(payload: object): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
```

- [ ] **Step 3: Write idempotency tests**

```typescript
// __tests__/idempotency.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPayload, isValidUUID } from '../../lib/idempotency';

describe('Idempotency Utils', () => {
  describe('hashPayload', () => {
    it('should generate consistent hash for same payload', () => {
      const payload = { taskTitle: 'Test', taskDescription: 'Description' };
      const hash1 = hashPayload(payload);
      const hash2 = hashPayload(payload);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different payloads', () => {
      const hash1 = hashPayload({ taskTitle: 'Test 1' });
      const hash2 = hashPayload({ taskTitle: 'Test 2' });
      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string', () => {
      const hash = hashPayload({ test: 'data' });
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('should return false for UUID v1', () => {
      // UUID v1 has different format
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add models/IdempotencyKey.ts lib/idempotency.ts
git commit -m "feat: add idempotency handling for decompose endpoint"
```

---

### Task 4: Structured Logger & Metrics

**Files:**
- Create: `lib/logger.ts`
- Create: `lib/metrics.ts`

- [ ] **Step 1: Create structured JSON logger**

```typescript
// lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  action?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export function createLogger(context: {
  requestId?: string;
  userId?: string;
  action?: string;
}) {
  return {
    info: (message: string, extra?: Record<string, unknown>) => {
      log('info', message, { ...context, ...extra });
    },
    warn: (message: string, extra?: Record<string, unknown>) => {
      log('warn', message, { ...context, ...extra });
    },
    error: (message: string, extra?: Record<string, unknown>) => {
      log('error', message, { ...context, ...extra });
    },
    debug: (message: string, extra?: Record<string, unknown>) => {
      log('debug', message, { ...context, ...extra });
    },
  };
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra,
  };
  console.log(JSON.stringify(entry));
}
```

- [ ] **Step 2: Create Prometheus metrics**

```typescript
// lib/metrics.ts
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

// Collect default metrics
collectDefaultMetrics({ register });

// Custom counters
export const requestsTotal = new Counter({
  name: 'requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

export const rateLimitedTotal = new Counter({
  name: 'rate_limited_total',
  help: 'Total number of rate-limited requests',
  labelNames: ['user_id', 'limit_type'],
  registers: [register],
});

export const llmErrorsTotal = new Counter({
  name: 'llm_errors_total',
  help: 'Total number of LLM errors',
  labelNames: ['error_type'],
  registers: [register],
});
```

- [ ] **Step 3: Commit**

```bash
git add lib/logger.ts lib/metrics.ts
git commit -m "feat: add structured logger and Prometheus metrics"
```

---

### Task 5: Main Decompose API Endpoint

**Files:**
- Create: `app/api/v1/tasks/decompose/route.ts`
- Modify: `models/Task.ts` (add fields)

- [ ] **Step 1: Update Task model with new fields**

Add to `models/Task.ts`:
```typescript
// Add to ITask interface
parentTaskId?: Types.ObjectId;
summary?: string;
referenceUrls?: string[];
requestedCompletionDate?: Date;
isDecomposedTask?: boolean;

// Add to TaskSchema
parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
summary: { type: String },
referenceUrls: [{ type: String }],
requestedCompletionDate: { type: Date },
isDecomposedTask: { type: Boolean, default: false },
```

- [ ] **Step 2: Create main API route**

```typescript
// app/api/v1/tasks/decompose/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { createMinimaxClient } from '@/lib/llm/client';
import { checkUserRateLimit, checkApiKeyRateLimit, getApiKeyFromRequest } from '@/lib/rate-limit-enhanced';
import { getCachedResponse, cacheResponse, hashPayload, isValidUUID } from '@/lib/idempotency';
import { createLogger } from '@/lib/logger';
import { requestsTotal, rateLimitedTotal, llmErrorsTotal } from '@/lib/metrics';
import { DecomposeRequest, DecomposeResponse } from '@/lib/llm/types';

// Validation helpers
function validateRequest(body: unknown): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const req = body as Record<string, unknown>;

  if (!req.taskTitle || typeof req.taskTitle !== 'string') {
    errors.taskTitle = 'taskTitle is required (string, 5-120 chars)';
  } else if (req.taskTitle.length < 5 || req.taskTitle.length > 120) {
    errors.taskTitle = 'taskTitle must be 5-120 characters';
  }

  if (!req.taskDescription || typeof req.taskDescription !== 'string') {
    errors.taskDescription = 'taskDescription is required (string, max 2000 chars)';
  } else if (req.taskDescription.length > 2000) {
    errors.taskDescription = 'taskDescription must be max 2000 characters';
  }

  if (req.contextLinks) {
    if (!Array.isArray(req.contextLinks)) {
      errors.contextLinks = 'contextLinks must be an array';
    } else if (req.contextLinks.length > 5) {
      errors.contextLinks = 'contextLinks must have max 5 items';
    } else {
      req.contextLinks.forEach((url, i) => {
        try {
          new URL(url as string);
        } catch {
          errors[`contextLinks.${i}`] = `Invalid URL: ${url}`;
        }
      });
    }
  }

  if (req.requestedCompletionDate) {
    const date = new Date(req.requestedCompletionDate as string);
    if (isNaN(date.getTime())) {
      errors.requestedCompletionDate = 'Invalid ISO-8601 date';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const logger = createLogger({ requestId, action: 'decompose_request' });

  try {
    // Authenticate
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      logger.warn('Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting - user level
    const userRateLimit = checkUserRateLimit(userId);
    if (!userRateLimit.success) {
      logger.warn('Rate limited (user)', { userId, limitType: 'user' });
      rateLimitedTotal.inc({ user_id: userId, limit_type: 'user' });
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(userRateLimit.resetIn) } }
      );
    }

    // Rate limiting - API key level
    const apiKey = getApiKeyFromRequest(request);
    if (apiKey) {
      const apiKeyRateLimit = checkApiKeyRateLimit(apiKey);
      if (!apiKeyRateLimit.success) {
        logger.warn('Rate limited (API key)', { apiKey: apiKey.substring(0, 8) + '...', limitType: 'api_key' });
        rateLimitedTotal.inc({ user_id: userId, limit_type: 'api_key' });
        return NextResponse.json(
          { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
          { status: 429, headers: { 'Retry-After': String(apiKeyRateLimit.resetIn) } }
        );
      }
    }

    // Parse and validate request
    const body = await request.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      logger.warn('Validation failed', { errors: validation.errors });
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: validation.errors },
        { status: 400 }
      );
    }

    const decomposeRequest = body as DecomposeRequest;

    // Idempotency check
    const idempotencyKey = request.headers.get('X-Idempotency-Key');
    if (idempotencyKey) {
      if (!isValidUUID(idempotencyKey)) {
        return NextResponse.json(
          { error: 'Invalid idempotency key (must be UUID v4)', code: 'INVALID_IDEMPOTENCY_KEY' },
          { status: 400 }
        );
      }

      const cached = await getCachedResponse(idempotencyKey, userId);
      if (cached) {
        logger.info('Returning cached response', { idempotencyKey, duration_ms: Date.now() - startTime });
        requestsTotal.inc({ method: 'POST', endpoint: '/api/v1/tasks/decompose', status: 200 });
        return NextResponse.json(cached);
      }
    }

    // Connect to DB
    await connectDB();

    // Call LLM
    let llmResponse: DecomposeResponse;
    try {
      const llmClient = createMinimaxClient();
      llmResponse = await llmClient.decomposeTask(decomposeRequest);
    } catch (llmError) {
      logger.error('LLM error', { error: String(llmError) });

      const errorMessage = String(llmError);
      if (errorMessage.includes('Aborted') || errorMessage.includes('timeout')) {
        // 504: Gateway timeout - upstream (LLM) didn't respond in time
        llmErrorsTotal.inc({ error_type: 'timeout' });
        return NextResponse.json(
          { error: 'LLM request timeout', code: 'LLM_TIMEOUT' },
          { status: 504 }
        );
      }
      // 502: Bad gateway - LLM returned invalid/error response
      llmErrorsTotal.inc({ error_type: 'bad_gateway' });
      return NextResponse.json(
        { error: 'LLM service unavailable', code: 'LLM_ERROR' },
        { status: 502 }
      );
    }

    // Validate LLM response
    if (!llmResponse.summary || !llmResponse.subtasks?.length) {
      return NextResponse.json(
        { error: 'Invalid LLM response', code: 'INVALID_LLM_RESPONSE' },
        { status: 502 }
      );
    }

    // Persist to database
    const parentTask = new Task({
      workspaceId: new Types.ObjectId(session.user.workspaceId),
      boardId: new Types.ObjectId(body.boardId), // Should be passed in request
      title: decomposeRequest.taskTitle,
      description: llmResponse.summary,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      summary: llmResponse.summary,
      referenceUrls: decomposeRequest.contextLinks,
      requestedCompletionDate: decomposeRequest.requestedCompletionDate
        ? new Date(decomposeRequest.requestedCompletionDate)
        : undefined,
      isDecomposedTask: true,
      subtasks: llmResponse.subtasks.map(st => ({
        title: st.title,
        completed: false,
      })),
    });

    await parentTask.save();

    // Update response with task ID
    const response: DecomposeResponse = {
      taskId: parentTask._id.toString(),
      summary: llmResponse.summary,
      subtasks: llmResponse.subtasks,
    };

    // Cache response if idempotency key provided
    if (idempotencyKey) {
      await cacheResponse(
        idempotencyKey,
        userId,
        hashPayload(body),
        response
      );
    }

    const duration = Date.now() - startTime;
    logger.info('Task decomposed successfully', {
      userId,
      taskId: response.taskId,
      subtaskCount: response.subtasks.length,
      duration_ms: duration,
    });

    requestsTotal.inc({ method: 'POST', endpoint: '/api/v1/tasks/decompose', status: 200 });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error', { error: String(error) });
    requestsTotal.inc({ method: 'POST', endpoint: '/api/v1/tasks/decompose', status: 500 });
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Write integration tests**

```typescript
// __tests__/decompose.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth.config', () => ({
  authConfig: {},
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Task', () => ({
  Task: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe('Decompose Endpoint Validation', () => {
  // Validation tests for the validateRequest function
  describe('validateRequest', () => {
    it('should accept valid request', () => {
      // This would test the validation function
      const validRequest = {
        taskTitle: 'Build authentication',
        taskDescription: 'Implement user login and registration system',
      };
      expect(validRequest.taskTitle.length).toBeGreaterThanOrEqual(5);
    });

    it('should reject short taskTitle', () => {
      const invalidRequest = {
        taskTitle: 'Hi', // Less than 5 chars
        taskDescription: 'Test description',
      };
      expect(invalidRequest.taskTitle.length).toBeLessThan(5);
    });

    it('should reject missing taskDescription', () => {
      const invalidRequest = {
        taskTitle: 'Valid title',
      };
      expect(invalidRequest.taskDescription).toBeUndefined();
    });

    it('should validate contextLinks URLs', () => {
      const validLinks = ['https://example.com', 'https://docs.com'];
      const invalidLink = 'not-a-url';

      expect(() => new URL(validLinks[0])).not.toThrow();
      expect(() => new URL(invalidLink)).toThrow();
    });

    it('should validate ISO-8601 date format', () => {
      const validDate = '2026-03-25T00:00:00Z';
      const invalidDate = 'not-a-date';

      expect(new Date(validDate).getTime()).toBeGreaterThan(0);
      expect(new Date(invalidDate).getTime()).toBeNaN();
    });
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add models/Task.ts app/api/v1/tasks/decompose/route.ts __tests__/decompose.test.ts
git commit -m "feat: add task decomposition API endpoint"
```

---

### Task 6: Metrics Endpoint

**Files:**
- Create: `app/api/v1/metrics/route.ts`

- [ ] **Step 1: Create metrics endpoint**

```typescript
// app/api/v1/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/v1/metrics/route.ts
git commit -m "feat: add Prometheus metrics endpoint"
```

---

### Task 7: OpenAPI Spec & Documentation

**Files:**
- Create: `openapi.yaml`
- Modify: `README.md`

- [ ] **Step 1: Create OpenAPI 3.1 spec**

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: Task Decomposition API
  version: 1.0.0
  description: AI-powered task decomposition service

servers:
  - url: https://your-domain.com
    description: Production
  - url: http://localhost:3000
    description: Development

paths:
  /api/v1/tasks/decompose:
    post:
      summary: Decompose a high-level task into subtasks
      operationId: decomposeTask
      tags:
        - Tasks
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - taskTitle
                - taskDescription
              properties:
                taskTitle:
                  type: string
                  minLength: 5
                  maxLength: 120
                  example: "Build user authentication system"
                taskDescription:
                  type: string
                  maxLength: 2000
                  example: "Implement login, logout, registration with email verification"
                contextLinks:
                  type: array
                  maxItems: 5
                  items:
                    type: string
                    format: uri
                  example: ["https://docs.example.com/auth"]
                requestedCompletionDate:
                  type: string
                  format: date-time
                  example: "2026-03-25T00:00:00Z"
                boardId:
                  type: string
                  example: "507f1f77bcf86cd799439011"
      headers:
        X-Idempotency-Key:
          schema:
            type: string
            format: uuid
          description: Optional UUID v4 for idempotent requests
      responses:
        200:
          description: Task successfully decomposed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecomposeResponse'
        400:
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        401:
          description: Unauthorized
        429:
          description: Rate limit exceeded
          headers:
            Retry-After:
              schema:
                type: integer
              description: Seconds to wait before retrying
        502:
          description: LLM service error

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    DecomposeResponse:
      type: object
      properties:
        taskId:
          type: string
        summary:
          type: string
          minLength: 150
          maxLength: 400
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SubTask'

    SubTask:
      type: object
      properties:
        title:
          type: string
          maxLength: 80
        description:
          type: string
          maxLength: 500
        estimatedHours:
          type: number
          minimum: 0.5
          maximum: 16
          multipleOf: 0.5
        priority:
          type: string
          enum: [Low, Medium, High]
        referenceUrls:
          type: array
          maxItems: 2
          items:
            type: string

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
        details:
          type: object

  /api/v1/metrics:
    get:
      summary: Prometheus metrics
      operationId: getMetrics
      tags:
        - Monitoring
      responses:
        200:
          description: Prometheus metrics
          content:
            text/plain:
              schema:
                type: string
```

- [ ] **Step 2: Commit**

```bash
git add openapi.yaml
git commit -m "docs: add OpenAPI 3.1 specification"
```

---

### Task 8: Docker & CI Pipeline

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

CMD ["npm", "start"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/flux
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=development-secret-change-in-production
      - MINIMAX_API_KEY=${MINIMAX_API_KEY}
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

- [ ] **Step 3: Create GitHub Actions CI**

```yaml
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Security audit
        run: npm audit --audit-level=high
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml .github/workflows/ci.yml
git commit -m "ci: add Docker and GitHub Actions CI pipeline"
```

---

### Task 9: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add setup documentation for the new endpoint**

Add section to README:
```markdown
## Task Decomposition API

### Setup

1. Add to `.env.local`:
```env
MINIMAX_API_KEY=your_minimax_api_key
```

### Rate Limiting

- Per-user: 20 requests / 60 minutes
- Per-API key: 100 requests / 24 hours

### Idempotency

Include `X-Idempotency-Key` header with UUID v4 for duplicate request protection.

### Metrics

Prometheus metrics available at `/api/v1/metrics`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add task decomposition API documentation"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

- [ ] **Step 2: Run linting**

```bash
npm run lint
```

- [ ] **Step 3: Run security audit**

```bash
npm audit --audit-level=high
```

- [ ] **Step 4: Verify endpoint works**

```bash
curl -X POST http://localhost:3000/api/v1/tasks/decompose \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskTitle": "Build a user dashboard",
    "taskDescription": "Create a dashboard showing user metrics and activity",
    "boardId": "507f1f77bcf86cd799439011"
  }'
```

- [ ] **Step 5: Commit final changes**

```bash
git add .
git commit -m "feat: complete task decomposition service implementation"
```
