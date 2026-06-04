# Landing Page AI Positioning — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax. This is a presentational redesign — verification is `tsc --noEmit` + `next build` + visual, not unit tests (these are landing components with no business logic).

**Goal:** Reposition the landing page around the single pitch "Describe your project. Flux plans it." with an animated hero demo as the centerpiece.

**Architecture:** One new presentational component (`HeroPlanningDemo`), rewrites of 6 existing landing components, a trimmed navbar, and a restructured `app/page.tsx` that drops 7 noise sections.

**Tech Stack:** Next.js 16 App Router, React, Framer Motion, Tailwind + CSS variables (`--brand-primary`, `--text-primary`, `--surface`, `--border-subtle`, etc.), Heroicons.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/landing/hero-planning-demo.tsx` | Create | Animated describe→board demo loop |
| `components/landing/hero-section.tsx` | Rewrite | Static headline + demo + single CTA |
| `components/landing/how-it-works-section.tsx` | Create | 3-step Describe/Review/Done |
| `components/landing/value-proposition.tsx` | Rewrite | 3 AI-specific benefits |
| `components/landing/who-its-for-section.tsx` | Rewrite | 3 personas, freelancer-first |
| `components/landing/faq-section.tsx` | Rewrite | 5 AI-planning questions |
| `components/landing/cta-section.tsx` | Rewrite | Footer CTA, single button |
| `components/landing/navbar.tsx` | Modify | Trim links to Pricing + How it works; CTA "Get started free" |
| `app/page.tsx` | Modify | New section order, remove 7 sections, footer tagline |

**Sections removed from `app/page.tsx`:** StatsSection, LogoMarquee, AnalyticsDashboard, LiveMetrics, LandingPageAnimation, HeroPreviewSection, TestimonialsSection.

**Conventions to follow (from existing components):** `"use client"`, `framer-motion` for animation, CSS variables for all colors, `max-w-7xl mx-auto` section containers, badge pattern (`rounded-full bg-[var(--brand-primary)]/10 ... uppercase tracking-widest`), `whileInView` with `viewport={{ once: true }}` for scroll reveals. Auth CTA links to `/signup`.

---

### Task 1: HeroPlanningDemo component

**Files:** Create `components/landing/hero-planning-demo.tsx`

Self-contained, no API. Two phases on a loop: `typing` (textarea fills char-by-char with the sample prompt) then `revealing` (4 columns appear, then task cards drop in with priority badges). Loop ~14s total. `aria-hidden` on the whole demo.

- [ ] Build the component (full code in execution).
- [ ] Sample prompt: `"Build a client portfolio site for a photography studio, 2-week deadline."`
- [ ] Columns: Backlog, In Progress, Review, Done.
- [ ] 6 cards: "Design homepage layout" (HIGH), "Set up CMS" (HIGH), "Implement contact form" (MEDIUM), "Mobile responsive pass" (MEDIUM), "Client review session" (MEDIUM), "Final handoff" (LOW).
- [ ] Priority badge colors: HIGH=red, MEDIUM=amber, LOW=green (via existing token-friendly Tailwind classes).
- [ ] Verify: `npx tsc --noEmit` passes.

### Task 2: Rewrite HeroSection

**Files:** Rewrite `components/landing/hero-section.tsx`

- [ ] Remove rotating headline carousel + persona switching + GSAP.
- [ ] Headline: "Describe your project. Flux plans it." (static)
- [ ] Subheadline: "Type what you're building. Get a full project board — tasks, priorities, time estimates — in seconds."
- [ ] Single CTA: "Get started free →" → `/signup`. Trust line: "No credit card required. Start planning in 60 seconds."
- [ ] Render `<HeroPlanningDemo />` right of copy on `lg:`, below on smaller.
- [ ] Keep the existing `GradientOrbs`/`GridPattern` background aesthetic.
- [ ] Verify: `npx tsc --noEmit`.

### Task 3: HowItWorksSection

**Files:** Create `components/landing/how-it-works-section.tsx`, anchor `id="how-it-works"`

- [ ] 3 steps (icon + number + heading + one sentence): Describe / Review / Done (copy per spec).
- [ ] Horizontal on `md:`, stacked below. Follow badge + heading pattern.

### Task 4: Rewrite ValueProposition

**Files:** Rewrite `components/landing/value-proposition.tsx`

- [ ] Replace 8 benefits with 3: "Stop planning from scratch", "Look organised from day one", "Know what's left at a glance" (copy per spec).

### Task 5: Rewrite WhoItsForSection

**Files:** Rewrite `components/landing/who-its-for-section.tsx`

- [ ] 3 personas freelancer-first: "Freelance developers & designers", "Indie builders", "Small teams" (copy per spec). Keep card grid/animation pattern.

### Task 6: Rewrite FAQSection

**Files:** Rewrite `components/landing/faq-section.tsx`

- [ ] 5 AI-planning questions with real answers (keep accordion mechanics, just swap `faqs` array).

### Task 7: Rewrite CTASection

**Files:** Rewrite `components/landing/cta-section.tsx`

- [ ] Headline "Your next client project starts here.", sub "Describe it. Flux plans it. You ship it.", single CTA "Get started free →" → `/signup`. Remove "Contact sales" secondary.

### Task 8: Trim navbar

**Files:** Modify `components/landing/navbar.tsx`

- [ ] `navLinks` → `[{label:'How it works', href:'#how-it-works'}, {label:'Pricing', href:'#pricing'}]`.
- [ ] Desktop CTA copy "Get started" → "Get started free".

### Task 9: Restructure page + footer

**Files:** Modify `app/page.tsx`

- [ ] Remove imports + usage of: StatsSection, LogoMarquee, AnalyticsDashboard, LiveMetrics, LandingPageAnimation, HeroPreviewSection, TestimonialsSection.
- [ ] Add import + usage: HowItWorksSection.
- [ ] Order: Navbar, HeroSection, HowItWorksSection, ValueProposition, WhoItsForSection, PricingSection, FAQSection, CTASection, Footer.
- [ ] Footer tagline → "Describe your project. Flux plans it."

### Task 10: Verify

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` succeeds.
- [ ] Commit.

---

## Self-Review

- **Spec coverage:** All 9 spec sections mapped to tasks 1–9. Removed-sections list matches spec. ✓
- **Pricing free-tier CTA copy** ("Start planning free") — handled in Task 9 note / will adjust in PricingSection if the string is a simple literal. Added to Task 9 scope.
- **No placeholders:** copy is locked from the spec; full JSX written at execution.
- **Type consistency:** `HeroPlanningDemo` is the only new exported symbol; imported in Task 2. `HowItWorksSection` exported in Task 3, imported in Task 9.
