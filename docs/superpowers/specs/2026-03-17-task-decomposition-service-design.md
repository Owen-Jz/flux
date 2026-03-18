# Task Decomposition Service Design

**Date:** 2026-03-17
**Status:** Approved

## Overview

AI-powered micro-service that accepts high-level task descriptions, uses LLM to research and decompose into actionable subtasks, and persists them to the existing task board.

## Architecture

- **Implementation**: Next.js API Route (`app/api/v1/tasks/decompose/route.ts`)
- **LLM Provider**: Minimax M2.5 API
- **Database**: MongoDB with existing mongoose models
- **Rate Limiting**: Enhanced dual-window (per-user + per-API key)

## API Specification

### Endpoint

```
POST /api/v1/tasks/decompose
```

### Request Schema

| Field | Type | Constraints |
|-------|------|-------------|
| taskTitle | string | 5-120 characters |
| taskDescription | string | max 2000 characters |
| contextLinks | string[] | max 5 valid URLs, optional |
| requestedCompletionDate | string | ISO-8601, optional |

### Response Schema

| Field | Type | Constraints |
|-------|------|-------------|
| taskId | string | MongoDB ObjectId |
| summary | string | 150-400 characters |
| subtasks | SubTask[] | 3-10 items |

### SubTask Schema

| Field | Type | Constraints |
|-------|------|-------------|
| title | string | ≤80 characters |
| description | string | ≤500 characters |
| estimatedHours | number | 0.5-16, 0.5-step |
| priority | string | Low, Medium, High |
| referenceUrls | string[] | ≤2 per subtask |

## Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token for authentication |
| X-Idempotency-Key | No | UUID v4 for idempotent requests |

## Database Schema

### Task Model Enhancement

Add to existing Task model:
- `parentTaskId`: Types.ObjectId (optional) - links subtask to parent
- `summary`: string (optional) - LLM-generated summary
- `referenceUrls`: string[] (optional) - external reference links
- `requestedCompletionDate`: Date (optional)
- `isDecomposedTask`: boolean (default: false)

### New: Idempotency Model

```typescript
interface IIdempotencyKey {
  key: string;          // UUID v4
  userId: Types.ObjectId;
  responseHash: string;  // SHA-256 of request payload
  response: object;     // Cached response
  expiresAt: Date;      // 24 hours from creation
  createdAt: Date;
}
```

## Rate Limiting

| Limit Type | Threshold | Window |
|------------|-----------|--------|
| Per-user | 20 requests | 60 minutes |
| Per-API key | 100 requests | 24 hours |

**Response on limit exceeded:**
- Status: 429
- Headers: `Retry-After` (seconds)

**Logging:** Log every limited request with user ID, timestamp, payload hash.

## Error Handling

| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Schema violations with field-level details |
| 429 | RATE_LIMITED | Rate limit exceeded |
| 502 | LLM_TIMEOUT | LLM fails within 15s |
| 504 | LLM_TIMEOUT | LLM timeout |

## Observability

### Structured JSON Logging

Log every request/response to stdout:
```json
{
  "timestamp": "2026-03-17T10:00:00.000Z",
  "level": "info",
  "requestId": "uuid",
  "userId": "user_id",
  "action": "decompose_request",
  "duration_ms": 1200
}
```

### Prometheus Metrics

Endpoint: `GET /api/v1/metrics`

| Metric | Type | Labels |
|--------|------|--------|
| requests_total | Counter | method, endpoint, status |
| rate_limited_total | Counter | user_id |
| llm_errors_total | Counter | error_type |

## Non-Functional Requirements

- **Latency**: p95 ≤ 1200ms (including LLM call)
- **Horizontal Scaling**: Stateless service
- **Security**: API keys via env vars only, never committed
- **Dependencies**: Zero high-severity vulnerabilities (npm audit)

## Deliverables

1. Source code in `src/` with unit tests (≥80% coverage)
2. OpenAPI 3.1 spec for the endpoint
3. Dockerfile and docker-compose.yml
4. README with setup, env vars, rate-limit tuning
5. GitHub Actions CI pipeline (tests, lint, security audit)

## Acceptance Criteria

1. POST /api/v1/tasks/decompose accepts valid JSON and returns decomposed tasks
2. Rate limiting returns 429 with Retry-After header
3. Idempotency key returns cached response within 24h
4. LLM timeout returns 502/504 with LLM_TIMEOUT code
5. All requests logged as JSON to stdout
6. /metrics endpoint exposes Prometheus counters
