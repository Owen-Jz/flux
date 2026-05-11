# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux is a task management platform built with Next.js 16 (App Router), featuring workspaces, boards, tasks, and team collaboration. It uses MongoDB/Mongoose for data persistence and NextAuth v5 for authentication.

## Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run vitest tests (unit tests, excludes e2e/mobile)
npm run test:run      # Run vitest once without watch mode
```

**Test configuration:** Vitest is configured to exclude `__tests__/mobile/**` and `__tests__/e2e/**`. Playwright is used for e2e tests (separate config).

## Architecture

### Directory Structure

```
app/                    # Next.js App Router pages and API routes
  [slug]/              # Dynamic workspace routes (dashboard, board, settings, etc.)
  api/                 # API routes including /v1/ REST API
  admin/               # Admin panel pages
  docs/                # Documentation pages
actions/               # Server Actions (state-changing operations)
models/                # Mongoose schemas and models
lib/                   # Utilities, auth, database, email, webhooks, etc.
hooks/                 # React hooks
components/            # Reusable React components (organized by feature)
types/                 # TypeScript type definitions
```

### Data Model

The core entities follow this hierarchy:

- **Workspace** → has many **Boards** → has many **Tasks**
- **Workspace** → has many **Members** (with roles: ADMIN, EDITOR, VIEWER)
- **Task** statuses: BACKLOG → TODO → IN_PROGRESS → REVIEW → DONE → ARCHIVED
- **Task** priorities: LOW, MEDIUM, HIGH

Key models: `User`, `Workspace`, `Board`, `Task`, `WorkspaceInvite`, `AuditLog`, `ApiKey`, `WebhookEndpoint`

### Authentication

NextAuth v5 is configured in `lib/auth.ts` with:
- Google OAuth provider
- Credentials provider (email/password with bcrypt)
- Failed login lockout (5 attempts → 15 min lockout)
- JWT session strategy

### Server Actions Pattern

Actions in `actions/` are async functions marked `'use server'` that:
1. Authenticate via `auth()` from NextAuth
2. Connect to DB via `connectDB()` from `@/lib/db`
3. Perform authorization checks (workspace membership, roles)
4. Call Mongoose models
5. Call `revalidatePath()` to invalidate Next.js cache
6. Optionally emit webhook events via `emitEvent()`

### API Routes

- **v1 API** (`app/api/v1/`): REST API for tasks, boards, workspaces, webhooks, api-keys
- **Billing** (`app/api/billing/`): Paystack integration for subscriptions
- **Auth** (`app/api/auth/`): Email verification, password reset, onboarding
- **Cron** (`app/api/cron/`): Background jobs (e.g., check-trials)

### Database Connections

`lib/db.ts` exports `connectDB()` which uses Mongoose's connection caching (singleton pattern) to avoid duplicate connections.

### Webhooks

`lib/webhook-emitter.ts` provides `emitEvent()` for dispatching webhook notifications. Webhook endpoints are stored in `models/WebhookEndpoint.ts`.

### Rate Limiting

`lib/rate-limit.ts` and `lib/rate-limit-enhanced.ts` provide per-user and per-API-key rate limiting for the v1 API.

### Plan Limits

`lib/plan-limits.ts` defines limits per subscription plan (free, starter, pro, enterprise). Actions check `canCreateProject()` before creating new boards.

## Key Conventions

- Path aliases: `@/*` maps to project root
- All Server Actions use `auth()` for session access and `connectDB()` before DB operations
- Workspace access checked via `isWorkspaceMember()` and `hasRole()` from `lib/workspace-utils.ts`
- `revalidatePath()` called after mutations to refresh Next.js cache
- Mongoose models use singleton pattern: `mongoose.models.X || mongoose.model('X', schema)`

## Environment Variables

Key variables needed:
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth session secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `PAYSTACK_SECRET_KEY` - Billing integration
- `MINIMAX_API_KEY` - Task decomposition AI (v1 API)