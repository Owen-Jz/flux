# CLAUDE.md

This file provides the mandatory operational protocol for Claude Code / OpenClaw agents working in this repository. 

## 🚨 THE PRIME DIRECTIVE (Zero-Defect Policy)
Token usage is explicitly unconstrained. Your absolute priority is system stability, architectural integrity, and 100% bug-free code. Do not take the "fastest path" if it compromises the system. Do not make assumptions. You are operating in a defensive programming environment.

You MUST execute every task using the following 4-Phase Pipeline. Do not skip phases.

---

## 🛠 THE 4-PHASE MANDATORY WORKFLOW (Procedural Enforcement)

### PHASE 1: Discovery & Impact Analysis (Think Before You Code)
Before modifying any file, you must output a written execution plan:
1.  **Grep Audit:** Use `grep` or `ripgrep` to locate every instance of the logic being modified.
2.  **Dependency Mapping:** Explicitly list every file that imports or depends on the target files.
3.  **State Management Impact ("Look Left and Right"):** Describe how the proposed change impacts database schemas, global user flows (e.g., redundant onboarding steps), Next.js caching, or NextAuth session states.

### PHASE 2: Defensive Execution (Behavioral Guardrails)
When writing code, you must adhere to these strict constraints:
1.  **No Ghost Code:** Do not leave `// TODO` or `// ... existing code` blocks. Write the complete, functional code.
2.  **Type Strictness:** All Next.js and Mongoose implementations must have exact TypeScript interfaces. No `any` types.
3.  **Cache Invalidation:** If mutating data, you must include `revalidatePath()` to prevent stale UI states.
4.  **Database Safety:** Ensure Mongoose models use the singleton pattern (`mongoose.models.X || mongoose.model('X', schema)`) to prevent overwrite errors.

### PHASE 3: Procedural Verification (The Mandatory Gates)
Before declaring a task "Complete", you MUST satisfy this Definition of Done (DoD) by running these commands in order:
- [ ] **Type Check:** Run `npx tsc --noEmit`. If there are type errors, fix them immediately.
- [ ] **Lint:** Run `npm run lint`.
- [ ] **Production Build:** Run `npm run build`. **This is non-negotiable.** 
- [ ] **Logic Verification:** The core intent is met and no redundant steps exist.

### PHASE 4: The Rollback Protocol
If `npx tsc --noEmit` or `npm run build` fails:
1.  You are in a **CRITICAL ERROR STATE**. Do not report success.
2.  Analyze the exact build/type error.
3.  If you fail to fix the error after 2 attempts, **REVERT** your changes to the previous working state using `git restore <file>` and explain the failure to the user.

---

## 🏗 PROJECT OVERVIEW: Flux

Flux is a task management platform built with Next.js 16 (App Router), featuring workspaces, boards, tasks, and team collaboration. It uses MongoDB/Mongoose for data persistence and NextAuth v5 for authentication.

## 💻 DEVELOPMENT COMMANDS

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build (MANDATORY GATEKEEPER)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run vitest tests (unit tests, excludes e2e/mobile)
npm run test:run     # Run vitest once without watch mode
npx tsc --noEmit     # Strict type checking (MANDATORY GATEKEEPER)

Test configuration: Vitest is configured to exclude __tests__/mobile/ and __tests__/e2e/. Playwright is used for e2e tests (separate config).

📐 ARCHITECTURE
Directory Structure
app/                    # Next.js App Router pages and API routes
  [slug]/               # Dynamic workspace routes (dashboard, board, settings, etc.)
  api/                  # API routes including /v1/ REST API
  admin/                # Admin panel pages
  docs/                 # Documentation pages
actions/                # Server Actions (state-changing operations)
models/                 # Mongoose schemas and models
lib/                    # Utilities, auth, database, email, webhooks, etc.
hooks/                  # React hooks
components/             # Reusable React components (organized by feature)
types/                  # TypeScript type definitions
Data Model
The core entities follow this hierarchy:

Workspace → has many Boards → has many Tasks

Workspace → has many Members (with roles: ADMIN, EDITOR, VIEWER)

Task statuses: BACKLOG → TODO → IN_PROGRESS → REVIEW → DONE → ARCHIVED

Task priorities: LOW, MEDIUM, HIGH

Key models: User, Workspace, Board, Task, WorkspaceInvite, AuditLog, ApiKey, WebhookEndpoint

Core Systems
Authentication: NextAuth v5 (lib/auth.ts) with Google OAuth, Credentials (bcrypt), 15-min lockout after 5 fails, JWT strategy.

Server Actions Pattern: Marked 'use server'. Flow: Authenticate (auth()) -> Connect DB (connectDB()) -> Authorize (isWorkspaceMember()) -> Mutate Models -> Invalidate Cache (revalidatePath()) -> Emit Webhook.

API Routes: /api/v1/ (REST), /api/billing/ (Paystack), /api/auth/ (Verification/Onboarding), /api/cron/ (Background jobs).

Database Connection: lib/db.ts exports connectDB() using connection caching (singleton) to avoid duplicates.

Webhooks: lib/webhook-emitter.ts provides emitEvent(). Endpoints stored in models/WebhookEndpoint.ts.

Rate Limiting: lib/rate-limit.ts and lib/rate-limit-enhanced.ts for per-user/per-API-key limits.

Plan Limits: lib/plan-limits.ts defines limits (free, starter, pro, enterprise). Actions MUST check canCreateProject().

🔑 KEY CONVENTIONS
Path aliases: @/* maps to project root.

Workspace access checked via isWorkspaceMember() and hasRole() from lib/workspace-utils.ts.

🌍 ENVIRONMENT VARIABLES
Key variables needed:

MONGODB_URI - MongoDB connection string

NEXTAUTH_SECRET - NextAuth session secret

GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET - Google OAuth

PAYSTACK_SECRET_KEY - Billing integration

MINIMAX_API_KEY - Task decomposition AI (v1 API)
