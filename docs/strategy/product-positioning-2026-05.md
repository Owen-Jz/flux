# Flux — Product Positioning & Strategy
*Captured: May 2026 | Branch: master*

---

## The Core Shift

**Old pitch:** "Task management made simple."

**New pitch:** "Describe your project. Flux plans it."

This is not a copy change. It's a category change. We moved from competing with Notion, Trello, and Linear (task managers) to competing with nothing — because no mainstream task tool generates your project structure from a description.

---

## Why The Original Framing Wasn't Working

Task management for solo users is a solved, commoditised space. Notion free tier, Linear free tier, Todoist — all excellent and free. Four rejected differentiators:

| Rejected Option | Why It Doesn't Work |
|---|---|
| Mobile-first experience | Table stakes. Every app is adding this. |
| Paystack + NGN pricing | Pricing alone isn't a product story. |
| Client-shareable boards | Everyone has this. Figma, Trello, Notion. |
| AI task decomposition (buried API) | The hook exists — it just wasn't visible. |

The turning point: Flux already has a working AI decomposition engine (MINIMAX, `POST /api/v1/tasks/decompose`). The problem wasn't the product — it was that the capability was buried in an API call nobody knew existed.

---

## Target User

**Not:** "individuals" or "solo users" (too broad, too commoditised)

**Yes:** Nigerian freelance developer/designer managing client work.

### Why This Person

- You ARE this person. You know exactly what frustrates them because you've lived it.
- You can reach them directly through existing communities (Nairaland, dev WhatsApp/Telegram groups, Twitter/X Nigerian tech).
- They have a specific, financially-consequential pain: disorganised client work leads to missed deliverables, embarrassment, and lost income.
- They're already paying for tools they consider business expenses.

### Their Status Quo

WhatsApp notes + scattered Google Docs + an abandoned Notion setup. The "plan" for each client project lives across 3 WhatsApp chats, a doc, and memory. When a client asks "where are we?" — that's the moment the pain becomes acute enough to pay to fix.

### The Economic Case for Paying

3–4 client projects/month × 45 min planning saved = ~3 hours recovered.
At ₦3,000/hour → ₦9,000/month in value.
Flux at ₦2,000–3,000/month is obvious ROI.

---

## The Hook

> "Tell Flux what you're building. It plans the project."

Not "AI-powered task manager." Not "smart kanban." The AI is the mechanism, not the brand. The pitch is the outcome: you describe your project in plain language, and a full project board appears — tasks, priorities, time estimates.

### Why This Specifically

Every other task tool makes you build the structure yourself:
1. Create board
2. Create columns
3. Type each task
4. Set each priority
5. Estimate each task

Flux collapses steps 1–5 into one: *describe what you're building.*

This is not a 10% improvement. It's a different interaction model.

---

## What We Built (May 2026)

### Phase 1: Surface the AI (already shipped)

- Added "Plan with AI" CTA to empty board state
- Exposed existing MINIMAX decomposition via a UI button (was API-only)
- Added deadline field to modal
- Updated modal header to "Plan with AI"

### Phase 2: Multi-Scale Planning Wizard (shipped May 31)

The full "Plan with AI" feature — a 6-step wizard that replaced the old single-task decomposer:

**Scope step** — User chooses scale:
- **This board** — generates tasks for the current board
- **Full project** — generates multiple boards with tasks (for bigger plans)

**Input step** — Description, deadline, context links, max tasks

**Review step** — Checklist UI before anything is created:
- Board mode: flat task list with checkboxes, priority badges, hour estimates
- Project mode: expandable board tree (check/uncheck whole boards or individual tasks)

**Creation** — Bulk creates boards and tasks only after user confirms

### New files shipped:
- `types/ai-plan.ts` — shared interfaces
- `lib/llm/project-planner.ts` — board and project planning prompts
- `app/api/ai/plan/route.ts` — dry-run planning endpoint
- `actions/ai-plan.ts` — bulk creation server action
- `components/board/plan-with-ai-modal.tsx` — the wizard

---

## The Agreed Premises

These were validated during the product diagnostic session:

1. The right individual target is the Nigerian freelance developer/designer managing client work — not a generic solo user.
2. The status quo (WhatsApp + scattered docs + abandoned Notion) is the real competitor, not Linear or Trello.
3. "Better task management" is not the pitch. "Describe your project, Flux plans it" is the pitch — because it changes what category Flux competes in.
4. The AI decomposition already existed and worked. The gap was making it the entry point, not a power-user API call.
5. Individual willingness to pay is directly tied to economic value. Saving 45+ min of planning per project at 3–4 projects/month = clear ROI.
6. Distribution before full repositioning — but the product must match the pitch before distribution runs. Otherwise, conversion from interest to signup is weak.

---

## Distribution Strategy

**Where to reach the target user:**
- Nigerian dev WhatsApp/Telegram groups
- Nairaland tech section
- Twitter/X Nigerian tech community
- Personal DMs to freelance developers you know

**The pitch post:**
"I built the AI project planner I wish I had when I was taking on client work."
(Not: "I built a task manager.")

**The demo:**
Open a new board → describe a client project → AI creates the full board in seconds.
This is showable. Show it.

**Validation target:**
- 10 freelancers agree to try it after seeing the demo
- 3 of those use "Plan with AI" for a real client project
- 1 says "this saved me time" in their own words, unprompted

---

## Monetization Path

**For individuals:** Free tier works as top-of-funnel acquisition. Individual willingness-to-pay is low unless the product has direct economic value. The AI planning feature creates that value.

**The real money:** Teams and workspaces. An individual freelancer signs up, uses it to manage client work, brings in a collaborator or client. That's where conversion happens.

**Suggested free tier gate (after 50 active users):**
- Free: 3 AI project plans/month
- Paid: unlimited AI planning + full project mode

Do not gate prematurely. Get the feature used first.

---

## Open Questions

1. **AI output quality.** The MINIMAX integration has been tested via API but not observed with real freelancers using natural language descriptions. Quality needs to be watched with 3 real users before marketing investment.
2. **Homepage copy.** Still says generic task management. Should be updated to reflect the AI planner pitch — but only after validating it lands with real users.
3. **Approach C (adaptive workspace).** Revisit after 50+ signups with behavioral data. Don't build it from instinct.

---

## What Was Noticed (Founder Signals)

- You rejected the first four positioning options with specific reasoning, not vague dissatisfaction. That's taste operating before the reasoning catches up.
- You picked "Nigerian builder" without hesitation — didn't reach for the larger addressable market. You know who you're building for because you are that person.
- You said the AI decomposition "should be one of the main selling factors" — you already had the right instinct, just hadn't articulated the exact pitch.
- The last 30+ commits before this session were stabilisation work: auth, invites, billing, emails, edge cases. The product was ready. What was missing was a reason someone would care.

---

## Related Files

- Design doc (office hours session, May 30): `~/.gstack/projects/Owen-Jz-flux/owen-master-design-20260530-224414.md`
- Implementation plan: `docs/superpowers/plans/2026-05-30-plan-with-ai-multi-scale.md`
- Prior design doc (workspace personalisation, May 27): `~/.gstack/projects/Owen-Jz-flux/owen-master-design-20260527-230508.md`
