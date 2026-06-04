# Flux — Project Memory & Context

> Reference doc for picking up work on Flux in a fresh chat. Captures what the
> product is, how the key systems work, what's been done recently, and the
> non-obvious facts that took digging to establish. Last updated: 2026-06-04.

---

## 1. What Flux is

A task-management platform repositioned (May–June 2026) around **AI project
planning**. The pitch: **"Describe your project. Flux plans it."** — type a
project in plain language and get a full board (tasks, priorities, time
estimates) in seconds.

- **Category move:** stopped competing with Notion/Trello/Linear ("better task
  management") and now competes on the AI-planning interaction, which mainstream
  task tools don't surface.
- **Target user:** freelance developers/designers managing client work (the
  positioning doc names the Nigerian freelance dev specifically). Hero speaks to
  solo/freelance; teams are acknowledged downstream, not on the hero.
- **Real differentiators today:** live streaming generation (tasks appear on the
  board in real time), "Undo all," and now a no-signup "try it" demo. These are
  copyable within a quarter — the window is open, not permanent.
- **Closest competitor:** Taskade ("Genesis" does nearly the same thing, well).
  ClickUp/Monday/Asana have the feature but are heavier/pricier; Linear/Notion
  aren't real competitors on this.
- Full positioning rationale: `docs/strategy/product-positioning-2026-05.md`.

## 2. Tech stack & architecture

- **Next.js 16 (App Router)**, React, TypeScript (strict, no `any` in new code),
  Tailwind + CSS variables for theming (`--brand-primary`, `--text-primary`,
  `--surface`, `--border-subtle`, etc.), Framer Motion, Heroicons.
- **MongoDB + Mongoose** (models use the singleton pattern
  `mongoose.models.X || mongoose.model(...)`). `connectDB()` in `lib/db.ts`.
- **NextAuth v5** (`lib/auth.ts`), Google OAuth + credentials.
- **Paystack** billing (NGN). Webhook at `app/api/billing/webhook/route.ts`.
- **MINIMAX** LLM for planning (`lib/llm/*`, `MINIMAX_API_KEY`).
- Server Actions in `actions/`; models in `models/`; utilities in `lib/`.
- Path alias `@/*` → project root (tsconfig AND `vitest.config.ts` — see §6).

### Data model
Workspace → Boards → Tasks. Workspace members have roles ADMIN/EDITOR/VIEWER.
Task status: BACKLOG → TODO → IN_PROGRESS → REVIEW → DONE → ARCHIVED.
Task priority: LOW/MEDIUM/HIGH. Access control in `lib/board-access.ts`
(fails closed; reviewed clean).

## 3. The AI planning feature (the core)

Three flows, all using MINIMAX via `lib/llm/client.ts` (`MinimaxClient`):

1. **Plan with AI modal** (`components/board/plan-with-ai-modal.tsx`) — authed,
   in-app. Scope step (board vs project) → input → review (checkboxes) → create.
   - Dry-run endpoint: `app/api/ai/plan/route.ts` (validates, returns plan JSON).
   - Creation server action: `actions/ai-plan.ts` (`createFromAIPlan`, `undoAIPlan`).
2. **Live streaming** (board scale) — `app/api/ai/plan/stream/route.ts` (SSE),
   consumed by `components/board/use-plan-stream.ts`, shown in
   `plan-stream-banner.tsx`, completion in `plan-complete-modal.tsx`.
   Skeleton → per-section task generation with bounded concurrency.
3. **Anonymous "try it"** (marketing hero) — see §5.

### LLM helper modules (`lib/llm/`)
- `client.ts` — MinimaxClient: `planProject`, `planSkeleton`, `planSection`,
  `decomposesTask`, `callAPI` (retry w/ exponential backoff, 30s timeout).
- `board-stream-planner.ts` — prompts + **pure exported** parsers/normalizers:
  `parseSkeletonResponse`, `parseSectionResponse`, `extractJsonString`,
  `normalizePriority`, `normalizeStatus`, `normalizeEstimatedHours`,
  `normalizeSectionTask`.
- `project-planner.ts` — board/project prompts + **pure exported**
  `parseProjectPlanResponse(content, scale)` (extracted from client.ts so it's
  testable; covers every failure branch).
- `sanitize.ts` — `sanitizeContextLinks(links, {maxLen, max})`: single source of
  truth for the contextLinks allowlist (http(s) only, length + count bounded).
- `types.ts`, plus `types/ai-plan.ts` (shared API/UI types).

### Key invariants (don't regress these)
- **`createFromAIPlan` treats its input as untrusted** — it's a public server
  action the browser calls directly, so LLM-route validation is bypassable. It
  validates/bounds title/description length, priority allowlist, and caps task
  (200/board) and board (20) counts.
- **`estimatedHours` is persisted** (Task schema field, both insert paths) and
  shown on task cards (`~Nh` chip). `normalizeEstimatedHours` clamps LLM output
  to 1–24 (NaN/0/negative → default 2; >24 → 24).
- LLM enum casing: model returns title-case ("High"); `normalizePriority`/
  `normalizeStatus` map to uppercase app enums with safe fallbacks.

## 4. Landing page (repositioned)

`app/page.tsx` order: Navbar → Hero → HowItWorks → ValueProposition →
WhoItsFor → Pricing → FAQ → CTA → Footer. All in `components/landing/`.

- **Hero** (`hero-section.tsx` + `hero-planning-demo.tsx`): "Describe your
  project. Flux plans it." with the interactive demo (see §5).
- Cut 8 noise sections (stats, logo marquee, live metrics, analytics dashboard,
  generic features grid, scroll animation, hero-preview, placeholder
  testimonials with fictional names).
- Pricing surfaces AI planning as the upgrade lever; free CTA "Start planning free".
- Specs: `docs/superpowers/specs/2026-06-03-landing-page-ai-positioning-design.md`,
  plan `docs/superpowers/plans/2026-06-03-landing-page-ai-positioning.md`.

## 5. Anonymous "try it" planner (newest, handle with care)

Visitors generate a real plan from the hero **without signing up**, then a
"Sign up free to save this plan" CTA converts them. The prompt is carried into
signup via `sessionStorage` key `flux_pending_plan` (kept out of the URL); the
board consumes it on mount and re-opens Plan with AI pre-seeded.

- **Endpoint:** `app/api/ai/plan/try/route.ts` (unauthenticated, no persistence,
  board-scale only, max 6 tasks, 10–500 char prompt).
- **Budget/abuse guard (layered, cheapest first):**
  1. Same-origin check (cross-origin → 403).
  2. In-memory burst limiter, 1 per 20s per IP (→ 429). *(in-memory =
     per-instance, see §6 caveat)*
  3. **Durable cross-instance quota** — `models/AnonPlanUsage.ts` +
     `lib/anon-plan-quota.ts`: atomic `$inc` counters with TTL index. Per-IP
     daily cap + global daily circuit breaker. IP checked before global.
     **This is the real budget guard.**
- **Env knobs** (defaults conservative — TUNE TO ACTUAL MINIMAX BUDGET):
  - `ANON_PLAN_IP_CAP` (default 3) — plans/IP/UTC-day.
  - `ANON_PLAN_DAILY_CAP` (default 100) — global daily ceiling = hard $ cap.
  - `ANON_PLAN_ENABLED=false` — kill switch.
- **Not done:** no CAPTCHA. The global cap bounds damage to a known $ amount even
  under IP rotation; if bots hit the cap instead of real users, add Vercel BotID
  or a turnstile next.

## 6. Project state & gotchas (the non-obvious stuff)

- **Deployment:** Vercel auto-deploys on push to `master` (via GitHub
  integration; `vercel.json` present, no local `.vercel` link). `next build`
  does NOT run lint — lint failures don't block the deploy.
- **CI is RED and has been since ~2026-05-28** — `.github/workflows/ci.yml` and
  `lint-and-typecheck.yml` run `npm run lint` as a hard gate, but the repo has
  ~135 pre-existing ESLint errors (mostly `@typescript-eslint/no-explicit-any`
  in `actions/task.ts`/`issue.ts`/`board.ts`, plus `react-hooks/set-state-in-effect`).
  **Red CI ≠ broken code here** — build + tsc + tests are green; verify those
  directly. Clearing the lint debt (~30–45 min) would make CI a real gate again.
  This is the top remaining cleanup item.
- **Rate limiting (`lib/rate-limit.ts`) is in-memory** — per-instance, resets on
  cold start. Fine for burst/UX, NOT a real distributed guard. The anon planner
  uses the DB-backed quota for that reason.
- **`.env.example` is gitignored** in this repo (don't try to commit it). Env
  docs live in code comments instead.
- **No `VERSION` file**; working branch is `master` directly (work is committed
  and pushed straight to master this session, per owner's choice).
- **Security to fix:** the git remote had an embedded GitHub token
  (`gho_...@github.com/Owen-Jz/flux.git` in `.git/config`) — rotate it.
- **Verification gates:** `npx tsc --noEmit`, `npm run test:run` (Vitest, excludes
  `__tests__/mobile` & `__tests__/e2e`), `npm run build`. Test suite ~371 passing.
  The "2 errors" in test output are pre-existing paystack unhandled-rejection
  noise, suppressed via `dangerouslyIgnoreUnhandledErrors` (exit 0).
- Dev server: `npm run dev` runs on port **3002**; `npm run start` on 3000.

## 7. This session's work (2026-06-02 → 06-04)

Started from a "are we good to go to production?" check. Commits (newest first):

| Commit | What |
|---|---|
| `4888e3e` | Anonymous "try it" planner + durable budget quota (§5) |
| `b3b31d9` | Interactive hero demo carrying prompt into signup |
| `357ba76` | Robust Undo-all (no dup cards, preserve order, surface errors) |
| `6f388b3` | Single source of truth for context-link sanitizing |
| `1f3c2a6` | Extract + test `parseProjectPlanResponse`, dedupe JSON parsing |
| `0144686` | Surface AI time estimates on task cards |
| `c20862c` | Persist + validate AI time estimates (schema + both paths) |
| `db83acd` | Landing page repositioned around AI planner pitch |
| `d9869fe` | Landing positioning spec |
| `3189db6` | Repaired test suite (was red), hardened AI-plan trust boundary, fixed calendar data-loss |

**Test suite grew 322 → 371.** Notably `3189db6` fixed the `@/` alias in
`vitest.config.ts` that had silently broken 12 billing-webhook tests (they never
ran), and rewrote them against the current route.

## 8. Likely next steps (owner's call)

1. **Clear the lint debt** so CI goes green (top hygiene item).
2. **Tune `ANON_PLAN_DAILY_CAP`** to real MINIMAX budget once traffic is observed.
3. **Distribution** — product now matches the pitch; per the strategy doc the
   next lever is the Nigerian dev communities (not a code task).
4. CAPTCHA/BotID on the anon endpoint if the global cap gets hit by bots.
5. Rotate the embedded git remote token.

## 9. Skill routing (this repo uses gstack)
See CLAUDE.md "Skill routing" — e.g. `/review` (pre-landing diff review),
`/ship`, `/qa`, `/investigate`, brainstorming before features. The 4-Phase
workflow (Discovery → Defensive Execution → Verification gates → Rollback) is
mandated in CLAUDE.md.
