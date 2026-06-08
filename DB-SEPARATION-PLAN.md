# Flux Database Separation — Implementation Plan (REVIEW BEFORE EXECUTION)

**Status:** Awaiting your approval. Nothing has been changed. Investigation was read-only.

---

## 1. Root cause (confirmed)

- `lib/db.ts` `connectDB()` calls `mongoose.connect(MONGODB_URI, { bufferCommands: false })` with **no `dbName`**.
- `MONGODB_URI` (in `.env.local`) has **no database in its path** (`.../?ssl=true&...`).
- Result: Mongoose connects to MongoDB's **default `test` database**.
- Every project on this Atlas cluster (`new_owen_user@…zvxia6f`) uses the **same admin credential**, and several connect with no `dbName` too → they all read/write `test` and collide on generic collections (`users`, `boards`, `tasks`, `admins`, `contacts`, `sessions`).
- 30+ standalone scripts in `scripts/` open their own connections, several with **hardcoded credentials** and no `dbName`. `scripts/clear-db.mjs` deletes data from whatever DB the credential defaults to (`test`) — the most likely cause of the Owen Digitals overwrite.

## 2. Current cluster state (read-only inspection, today)

- ~20 databases exist; **most projects already have their own DB** (`arkinvest`, `bizu`, `owen-zen`, `brinova`, …).
- **Flux is the exception:** its data is in **`test`**, not in `flux`.
- **`flux` DB exists but is empty** apart from one stray `notes` document (not Flux data).
- **`test` (41 collections)** = Flux's collections **+** other projects' collections dumped together.

### Flux-owned collections in `test` to migrate
| Collection | Docs | Notes |
|---|---|---|
| users | 39 | ⚠ generic name (verify shape) |
| workspaces | 43 | Flux-shaped (ownerId, members, inviteCode) |
| boards | 25 | Flux-shaped (workspaceId, categories) |
| tasks | 163 | Flux-shaped (workspaceId, boardId, subtasks) |
| activitylogs | 496 | Flux-signature |
| issues | 9 | Flux-shaped |
| accessrequests | 1 | Flux-signature |
| auditlogs | 1 | Flux |
| failedwebhooks | 1 | Flux-signature |
| admins | 1 | ⚠ generic name (verify shape) |
| apikeys, webhookendpoints, workspaceinvites, pushsubscriptions, processedwebhooks, idempotencykeys, contacts | 0 | empty, created on first use |

**NOT migrated (belong to other projects):** `applications, blogposts, bucketlistitems, companies, dominance_logs, emailtemplates, expenses, financecategories, habits, investments, lead_hunter, otpcodes, paperwallets, parents, partnerships, payments, projectbriefs, projects, sessions, strategic_intel, subscribers, verifiedemails, weeklyhabits, notifications`.

## 3. Target state

Flux uses its **own `flux` database** on the same cluster, fully isolated. No other project (or stray script) touches Flux data again. `test` is left **untouched** as a backup/rollback.

## 4. Strategy: COPY, not move (non-destructive)

We **copy** Flux's collections `test → flux`, leaving `test` intact. If anything goes wrong, we flip one config value back to `test`. We only ever consider deleting from `test` weeks later, after you're fully confident.

For the three generic collections (`users`, `admins`, `contacts`) we **copy every document** — this guarantees Flux behaves *identically* after the cutover (it reads exactly the same set it reads today). Any non-Flux strays copied in are inert (Flux never references them). We can prune them later once identified; copying them causes no harm and risks no data loss.

## 5. Execution phases (after your approval)

**Phase A — Safety net**
- A1. `mongodump` the entire `test` database to a local timestamped folder (full backup before touching anything).
- A2. Confirm the `flux` DB's only content is the stray `notes` doc (leave it or drop just that one doc — your call).

**Phase B — Data copy (`test → flux`), idempotent**
- B1. Run a controlled migration script that, for each Flux-owned collection, copies all docs into `flux` using bulk upsert by `_id` (re-runnable, no dupes).
- B2. Print a before/after count table; **assert** `flux` counts == `test` counts for every migrated collection. Abort on mismatch.

**Phase C — Code changes (the actual fix)**
- C1. `lib/db.ts`: add `dbName: process.env.MONGODB_DB || 'flux'` to the connect options.
- C2. Add `MONGODB_DB=flux` to `.env.local` (and document in `.env.example`).
- C3. Update **all** `scripts/*` that open a Mongoose/Mongo connection to pass the same `dbName: 'flux'` (so seed/maintenance scripts can never hit `test` again). Parallelized across agents.
- C4. Neutralize the footgun: make `scripts/clear-db.mjs` refuse to run unless `dbName` is explicitly set and confirmed (guard against the exact overwrite that happened).

**Phase D — Cutover & verification**
- D1. `next build && next start`, point the app at `flux` (via the new dbName), and run the QA smoke checks from the last session (login redirect, API auth, a read of workspaces/boards/tasks) against `flux`.
- D2. Confirm doc counts and that the app shows the same workspaces/boards/tasks it did against `test`.
- D3. Deploy (Vercel env var `MONGODB_DB=flux`).

**Phase E — Post-cutover**
- E1. Monitor for 24–48h. `test` remains the rollback target (revert `MONGODB_DB` to unset/`test`).
- E2. (Later, on your go) optionally drop Flux's now-duplicated collections from `test` so `test` stops being a dumping ground.

## 6. Rollback
At any point before Phase E2, set `MONGODB_DB` back to `test` (or remove it) and redeploy. `test` is never modified during A–D, so rollback is instant and lossless.

## 7. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Live writes to `test` during copy create drift | Dataset is tiny; do copy + cutover in one short window; migration is re-runnable for a final delta sync just before flip. |
| Generic `users`/`admins` partly belong to other apps | Copy-all (superset) → Flux behaves identically; strays inert; prune later. |
| A missed script still writes to `test` | Phase C updates **every** connection site; grep gate verifies zero `mongoose.connect` without `dbName` remain. |
| Accidental data loss | Full `mongodump` backup (A1) + copy-not-move + `test` untouched until E2. |

## 8. Related issues found (recommend, separate from core task)
- **Exposed DB credentials**: the cluster password is **hardcoded in committed scripts** (`scripts/create-admin.ts`, `list-users.ts`, `print_users.js`, `test_lean.js`, `inspect_boards.js`, several `.mjs`). These should be rotated and replaced with `process.env.MONGODB_URI`. (I can do this as a follow-up workstream.)
- **Single all-powerful DB user**: every app uses one `authSource=admin` user with full cluster access — which is why a stray script can clobber any DB. Long-term: create a per-app DB user scoped to only the `flux` database.

## 9. What I need from you (decisions)
1. **Target**: `flux` DB on the **same cluster** (recommended, simplest, fixes the problem) — or a **brand-new separate cluster** (stronger isolation, more setup)?
2. **Credential rotation**: include now, or track as a separate follow-up?
3. **Approve Phases A–D to execute now?** (Phase E2 deletion stays gated on your later go-ahead.)
