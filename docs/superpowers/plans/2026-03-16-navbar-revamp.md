# Navbar Revamp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the homepage navbar with cleaner visuals, minimal scroll behavior, and improved aesthetics while keeping all current elements.

**Architecture:** Single-component refinement in the existing Navigation component. No new files needed - direct modification of app/page.tsx.

**Tech Stack:** Next.js, Tailwind CSS, Framer Motion (existing)

---

## Files

- Modify: `app/page.tsx` - Navigation component (lines 33-151)

---

## Task 1: Refine Navbar Visuals

- [ ] **Step 1: Remove logo gradient glow**

In `app/page.tsx`, find lines 65-72 (logo section) and remove the gradient glow wrapper:

```tsx
// Before:
<div className="relative">
  <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
  <img
    src="/icon.svg"
    alt=""
    className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
  />
</div>

// After:
<img
  src="/icon.svg"
  alt=""
  className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
/>
```

- [ ] **Step 2: Simplify nav link styling**

Find lines 77-88 (nav links section), update to cleaner hover:

```tsx
// Current: uses underline effect
// Change to: simple color shift on hover
<a
  key={link.href}
  href={link.href}
  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors"
>
  {link.label}
</a>
```

- [ ] **Step 3: Refine CTA button styling**

Find lines 102-112 (CTA button), simplify:

```tsx
<Link
  href="/signup"
  className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
>
  Get started free
</Link>
```

- [ ] **Step 4: Update scroll behavior**

Find lines 52-60 (nav element), change to minimal scroll effect:

```tsx
<nav
  className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
    isScrolled
      ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50'
      : 'bg-transparent'
  }`}
  role="navigation"
  aria-label="Main navigation"
>
```

- [ ] **Step 5: Commit changes**

```bash
git add app/page.tsx
git commit -m "refactor: refine navbar with cleaner visuals and minimal scroll"
```

---

## Task 2: Verify Implementation

- [ ] **Step 1: Check implementation against spec**

Review the spec at `docs/superpowers/specs/2026-03-16-navbar-revamp-design.md` and verify:
- [ ] Logo has no gradient glow
- [ ] Nav links use color hover instead of underline
- [ ] CTA button is simplified
- [ ] Scroll behavior is minimal (faster transition, subtle blur)
- [ ] All elements still present

- [ ] **Step 2: Test locally**

Start dev server and verify navbar renders correctly:
```bash
npm run dev
```

- [ ] **Step 3: Final commit**

```bash
git commit --allow-empty -m "chore: navbar revamp complete"
```
