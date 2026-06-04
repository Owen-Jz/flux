# Landing Page Redesign — AI Project Planner Positioning
*Spec date: 2026-06-03 | Status: Approved*

---

## Goal

Reposition the Flux landing page from a generic collaboration tool to a single-pitch AI project planner. Every section exists to reduce friction toward one action: "Get started free."

The primary visitor is a freelance developer or designer managing client work. The hero speaks directly to them. Teams are acknowledged downstream but never compete with the core pitch.

---

## Core Message

> "Describe your project. Flux plans it."

This is the headline. It does not rotate. It does not personalise by persona. It is the entire pitch in five words.

---

## Page Structure (top to bottom)

### 1. Navbar
- Logo (left)
- Two links max: "Pricing" and "Sign in"
- One CTA button (right): "Get started free"
- No mega-menu, no feature dropdowns
- Existing `LandingNavbar` component — trim links, confirm CTA copy

### 2. Hero
**Headline:** "Describe your project. Flux plans it."
**Subheadline:** "Type what you're building. Get a full project board — tasks, priorities, time estimates — in seconds."
**CTA:** "Get started free →" (single CTA, no secondary)
**Trust line** (below CTA, subdued): "No credit card required. Start planning in 60 seconds."

**Hero animation** (new component: `HeroPlanningDemo`):
- A textarea with a blinking cursor
- Text types itself character by character: *"Build a client portfolio site for a photography studio, 2-week deadline."*
- A "Generate Plan" button pulses and triggers
- A Kanban board materialises: columns appear (Backlog, In Progress, Review, Done), then task cards drop in one by one with titles, priority badges (HIGH/MEDIUM/LOW), and hour estimates
- Loop duration: ~8 seconds idle → ~4 seconds animation → 2 second hold → repeat
- Built in pure CSS/Framer Motion — no real API call, no auth required
- Positioned to the right of copy on desktop, below copy on mobile

**Rewrite:** Full rewrite of `HeroSection`. Remove rotating headline carousel. Remove multi-persona switching.

### 3. How It Works
**New component: `HowItWorksSection`**

Three steps, horizontal on desktop, stacked on mobile. Icon + step number + heading + one sentence each.

| Step | Heading | Copy |
|---|---|---|
| 1 | Describe | Type what you're building. Project name, rough deadline, any context. Plain English, no templates. |
| 2 | Review | Flux generates a full board with tasks, priorities, and estimates. Check off what you want, remove what you don't. |
| 3 | Done | Your board is live. Start working, share with a client, or hand it to your team. |

### 4. Value Props
**Rewrite:** `ValueProposition` component. Cut from 8 generic benefits to 3 specific ones.

| Heading | Copy |
|---|---|
| Stop planning from scratch | Every new client project used to mean an hour of setup. Now it's 30 seconds. |
| Look organised from day one | Share a structured board with your client before the first call. First impressions matter. |
| Know what's left at a glance | Tasks, priorities, and progress in one place. No more piecing it together from messages. |

Remove: "Feels Instant", "Your Data is Safe", "Share with One Link", "Less Busywork", "Control Who Sees What", "Discussions That Don't Get Lost", "See Where Time Goes", "Everyone on the Same Page."

### 5. Who It's For
**Rewrite:** `WhoItsForSection`. Three personas, heading + two lines each.

| Persona | Heading | Copy |
|---|---|---|
| Freelance developers & designers | You take on client work solo. | Flux turns a brief into a structured plan before the project even starts. |
| Indie builders | Side project, startup, personal tool. | Stop keeping the roadmap in your head. |
| Small teams | One person plans, everyone else knows what to do. | No status meetings to explain what's happening. |

### 6. Pricing
- Keep existing `PricingSection` — structure is correct
- Update free tier CTA copy to: "Start planning free"
- Call out AI planning explicitly in the paid tier as the primary upgrade reason

### 7. FAQ
**Rewrite:** `FAQSection`. Replace generic SaaS questions with AI-planning-specific ones.

Questions:
1. How good is the AI plan it generates?
2. Can I edit the plan before it creates anything?
3. Does it work for any type of project?
4. What happens to my data?
5. Is there a free plan?

### 8. Footer CTA
**Rewrite:** `CTASection`.

> **"Your next client project starts here."**
> "Describe it. Flux plans it. You ship it."
> CTA: "Get started free →"

### 9. Footer
- Keep existing footer
- Update brand tagline from "One place where your engineering team collaborates, stays aligned, and ships faster—without the chaos." to: "Describe your project. Flux plans it."

---

## Sections Removed

The following sections are cut from the current page entirely. They dilute the AI planning story without adding conversion value:

| Section | Reason |
|---|---|
| `StatsSection` | Generic numbers with no credibility anchor |
| `LogoMarquee` | No real customer logos; looks fabricated |
| `AnalyticsDashboard` | Wrong story — analytics is not the pitch |
| `LiveMetrics` | Irrelevant to the AI planning pitch |
| `LandingPageAnimation` | Scroll animation with no clear message |
| `HeroPreviewSection` | Replaced by the inline `HeroPlanningDemo` animation |
| `TestimonialsSection` | Placeholder content (fictional names/companies) — removed. Reinstate when real testimonials exist. |

---

## New Component: `HeroPlanningDemo`

This is the only genuinely new component required. Everything else is a rewrite of existing components.

**Purpose:** Simulate the "describe → board appears" interaction so visitors understand the product before signing up.

**Implementation:**
- Built with Framer Motion (already a dependency)
- No API calls — purely presentational
- Two states: `typing` (textarea fills character by character) and `revealing` (board columns + cards animate in)
- Accessible: `aria-hidden="true"` on the entire demo, `aria-label` on the CTA
- Responsive: right-aligned on `lg:`, below copy on `md:` and below

**Typing sequence:**
```
"Build a client portfolio site for a photography studio, 2-week deadline."
```

**Board that materialises:**
- 4 columns: Backlog, In Progress, Review, Done
- 6–8 task cards total across Backlog and In Progress
- Sample tasks: "Design homepage layout", "Set up CMS", "Implement contact form", "Mobile responsive pass", "Client review session", "Final handoff"
- Priority badges: 2 HIGH (red), 3 MEDIUM (amber), 2 LOW (green)

---

## Copy Inventory

| Location | Current | New |
|---|---|---|
| Hero headline | Rotating: "Your team, finally in sync" | "Describe your project. Flux plans it." |
| Hero subheadline | Generic collaboration copy | "Type what you're building. Get a full project board — tasks, priorities, time estimates — in seconds." |
| Hero CTA | "Get started" | "Get started free →" |
| Footer tagline | "One place where your engineering team..." | "Describe your project. Flux plans it." |
| Pricing free tier CTA | "Get started" | "Start planning free" |
| Footer CTA headline | (generic) | "Your next client project starts here." |

---

## What Does Not Change

- Route structure (`app/page.tsx`)
- Auth flow — "Get started free" links to `/signup` (existing)
- Pricing data and plan structure
- Footer link structure
- Design tokens, colours, dark mode support

---

## Success Signal

A visitor who lands on this page understands within 5 seconds:
1. What Flux does (AI generates your project board)
2. Who it's for (freelancers and solo builders with client work)
3. What to do next (get started free)

They do not need to scroll to understand the pitch. The hero carries it.
