# Cresio Labs — Social Media Content Calendar Seeding

**Date:** 2026-06-09
**Owner:** Social media manager (agent) + owen
**Status:** Approved design → implementation

## Goal

Take the Cresio Labs June content plan (from `cresio content calendar (1).html`) and turn it into
fully managed, publish-ready tasks inside the Flux **CresioLabs** workspace, on the existing
**Social Media** board, so each post appears on the board's content calendar **and** in the task
list. Each task carries finished, platform-tailored captions in its description.

## Confirmed decisions

1. **Platforms:** LinkedIn + Instagram + **Twitter/X added as a third platform.** Posts marked
   "Both" in the plan now target LI + IG + X. Single-platform posts stay single.
2. **Captions:** Platform-tailored variants (not one master caption). LinkedIn = professional/longer,
   Instagram = punchier + emoji + larger hashtag block, Twitter/X = ≤280 chars.
3. **Dates:** Start today (Tue, Jun 9 2026); preserve the plan's relative spacing; **snap the 4
   weekend posts to the nearest weekday** (no collisions).
4. **Existing tasks:** Wipe & recreate — delete the 16 existing `content-calendar`-tagged tasks on
   the Social Media board, recreate all 16 cleanly.
5. **Categories:** Add the 8 content types as board categories (legend colors) and assign each task.
6. **Images:** Out of scope. One-line image direction per post only. No asset generation.
7. **Caption authoring:** Written directly applying the documented Cresio voice + 5-part formula.

## Target location (resolved by slug at runtime, not hardcoded IDs)

- Workspace: `CresioLabs` (slug `cresiolabs`)
- Board: `Social Media` (slug `social-media`)

## Post → Task field mapping

| Source | Task field | Value |
|---|---|---|
| Topic | `title` | post headline |
| Captions + briefs | `description` | structured markdown (see below) |
| Priority | `priority` | HIGH / MEDIUM (from plan) |
| Publish date | `scheduledDate` + `dueDate` | same datetime, `T09:00:00.000Z`. `scheduledDate` drives the board content calendar; `dueDate` mirrors to workspace calendar + task sorting |
| Status | `status` | `TODO` |
| Type/platform/week/format | `tags` | `content-calendar`, `week-N`, each platform tag, format, type |
| Content type | `categoryId` | mapped to created board category |
| Index | `order` | 0–15 |

## Description format (per task)

Only the platform sections relevant to that post are included.

```
**Type:** <type> · **Format:** <single post | carousel N slides> · **Pillar:** <pillar>
**Publish window:** <platform-specific optimal time note>

### 🔗 LinkedIn
<finished caption: Hook → Body → Bridge → CTA>
#CresioLabs #Tag #Tag

### 📸 Instagram
<finished caption, punchy, emoji, line breaks, save/comment prompt>
·
·
#CresioLabs #Tag #Tag #Tag (up to ~8)

### 𝕏 Twitter/X
<≤280 chars, sharp hook + single CTA; carousel → "🧵" note>
#CresioLabs #Tag

---
🎨 Image direction: <one line, basic only>
🎠 Carousel slides: <one-liner per slide, carousels only>
```

## Brand voice (from the plan)

Confident · Forward-Thinking · Human · Direct. 5-part caption formula:
Hook → Body → Bridge → CTA → ≤3 hashtags (LinkedIn/Twitter; Instagram may use up to ~8).

## Final schedule (weekend-snapped, no collisions)

| # | Date | Day | Post | Type | Platforms | Pri |
|---|---|---|---|---|---|---|
| 1 | Jun 9 | Tue | Why Most SaaS Brands Get Visual Identity Wrong | Thought Leadership | LI | M |
| 2 | Jun 11 | Thu | 5 Rules for Every Landing Page (carousel 7) | Tips & Tricks | LI·IG·X | H |
| 3 | Jun 12 | Fri | Increased Trial Signups 47% in 90 Days | Case Study | LI | H |
| 4 | Jun 16 | Tue | New Design Sprint Framework | Announcement | LI·IG·X | H |
| 5 | Jun 17 | Wed | A Day in Our Design Process (carousel 5) | Behind the Scenes | IG | M |
| 6 | Jun 19 | Fri | The Hierarchy Mistake (carousel 6) | Educational | LI | H |
| 7 | Jun 22 | Mon | Which Design Trend Will Die in 2025? | Engagement | LI·IG·X | M |
| 8 | Jun 23 | Tue | "CMO + Design Team in One" testimonial | Testimonial | LI | H |
| 9 | Jun 25 | Thu | Stop Using Dark Mode for Everything | Educational | LI | M |
| 10 | Jun 26 | Fri | 3 Figma Shortcuts (carousel 5) | Tips & Tricks | IG | M |
| 11 | Jun 29 | Mon | A Rebrand Story (6 weeks) | Case Study | LI·IG·X | H |
| 12 | Jun 30 | Tue | Best Brands Have One Thing in Common | Thought Leadership | LI | M |
| 13 | Jul 2 | Thu | Redesigning Our Website — Moodboard (carousel 6) | Behind the Scenes | IG | M |
| 14 | Jul 3 | Fri | Why CTA Button Colour Matters (carousel 7) | Educational | LI·IG·X | H |
| 15 | Jul 6 | Mon | One Design Resource You Recommend (carousel 4) | Engagement | LI·IG·X | M |
| 16 | Jul 7 | Tue | June Wrap-Up: What Performed | Announcement | LI·IG·X | M |

## Board categories (legend colors)

| Category | Color |
|---|---|
| Thought Leadership | #2E7D32 |
| Tips & Tricks | #283593 |
| Case Study | #1565C0 |
| Announcement | #F57F17 |
| Behind the Scenes | #6A1B9A |
| Educational | #00838F |
| Testimonial | #00695C |
| Engagement | #C62828 |

## Build mechanism

Single re-runnable seed script `scripts/seed-cresio-social-calendar.cjs`, mirroring the existing
`scripts/seed-content-calendar.js` pattern:

1. Connect (`MONGODB_URI`, `dbName` = `MONGODB_DB || flux`).
2. Resolve workspace (slug `cresiolabs`) + board (slug `social-media`). Abort if missing.
3. Upsert the 8 categories onto the board; build `type → categoryId` map.
4. Delete existing tasks `{ boardId, tags: 'content-calendar' }`.
5. Insert the 16 enriched tasks.
6. Print a summary table (date · platforms · title).

## Out of scope

- Image/asset generation.
- Any app/UI code changes (the existing board task list + content calendar already read these fields).
- Auto-publishing / scheduling integrations (Buffer/Later). Tasks are management artifacts only.

## Verification

- Re-run the read-only discovery: board shows 16 `content-calendar` tasks, all with `scheduledDate` set.
- Spot-check 2–3 task descriptions render the platform sections correctly.
- `npx tsc --noEmit` unaffected (script is standalone `.cjs`).
