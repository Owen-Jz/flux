# Hero Section Performance Optimization Design

**Date:** 2026-04-10
**Status:** Approved
**Parent:** hero-preview-enhancement-design.md

---

## Overview

Optimize the hero and hero-preview sections of the landing page for faster initial load, smoother scroll transitions, and reduced memory/CPU usage on less powerful devices — while preserving the existing visual design exactly.

---

## Component: Hero Section (`components/landing/hero-section.tsx`)

### 1. Gradient Orbs — Replace CSS blur with opacity layering

**Before:**
- Large `viewWidth` percentages (`80vw`, `70vw`, `60vw`) with heavy `blur-[120px]`
- Two complete sets duplicated for light/dark mode in JSX
- Continuous GPU recalculation due to viewport-relative sizing

**After:**
- Fixed `max-w-[600px]` / `max-h-[600px]` sizes (already present, ensure consistent)
- Remove `blur-*` entirely — use layered opacity gradients instead
- Single set of orbs with `dark:` variant overrides (no JSX duplication)
- Add `will-change: transform` hint for browser optimization

**Files:** `components/landing/hero-section.tsx`

---

### 2. Animated Text — Reduce motion spans

**Before:**
- Per-word `motion.span` for every word (~10 spans per headline line)
- Stagger delay: `i * 0.08` per word
- `rotateX: -20` 3D effect on each span

**After:**
- First line (`Ship faster with`): Keep per-word spans, reduce stagger to `i * 0.05`, max 4 words
- Second line (`your team in flow`): Single `motion.span` wrapper with opacity-only transition (`opacity: 0` → `1`, `duration: 0.8`)
- Remove `rotateX` 3D transform (GPU-heavy)

**Files:** `components/landing/hero-section.tsx` (lines ~70-92, ~177-193)

---

### 3. Continuous Animations — CSS Fallback

**Before:**
- Framer Motion `animate={{ scale: [1, 1.2, 1] }}` on pulse dot (trust badge)
- Framer Motion `animate={{ y: [0, 8, 0] }}` on scroll indicator
- Framer Motion `animate={{ x: [0, 4, 0] }}` on CTA arrow icon

**After:**
- All three replaced with CSS `@keyframes` in `app/globals.css`
- `animation` property on static elements — zero JS animation loop
- Keep `motion.span` for hover states only (not continuous)

**Files:** `components/landing/hero-section.tsx`, `app/globals.css`

---

### 4. Social Proof Avatars

**Before:**
- `motion.div` wrapper per avatar with `whileHover={{ scale: 1.2 }}`
- Unsplash images without lazy loading

**After:**
- Static `div` with CSS `transition: transform 0.2s` for hover
- Add `loading="lazy"` to all `<Image>` components
- Add `decoding="async"` and `sizes="40px"` for proper sizing

**Files:** `components/landing/hero-section.tsx` (lines ~248-276)

---

## Component: Hero Preview (`components/landing/hero-preview.tsx`)

### 5. Floating Cards — Mobile reduction

**Before:**
- 2 floating cards always rendered, `display: none` via Tailwind at `hidden md:block`
- All scroll parallax handlers (`y1`, `y2`) active on all devices

**After:**
- Desktop (≥1024px): 2 floating cards with parallax
- Tablet (768px-1023px): 1 floating card, reduced parallax
- Mobile (<768px): 0 floating cards, simplified layout
- Reduce parallax strength on tablet: `y1 = v * 0.05`, `y2 = v * 0.08`

**Files:** `components/landing/hero-preview.tsx` (lines ~118-167)

---

### 6. GSAP ScrollTrigger — Mobile conditional

**Before:**
- Always initializes `gsap.registerPlugin(ScrollTrigger)`
- Pins for full `+=100%` viewport height
- Always applies `scrub: 1` scroll handler

**After:**
- `if (typeof window !== "undefined" && window.innerWidth >= 768)` guard before GSAP init
- Reduce pin height: `+=80%` on desktop
- Mobile: Hero section unpinned, hero-preview fades in with simple CSS transition

**Files:** `components/landing/hero-preview.tsx` (lines ~497-518)

---

### 7. Floating Dashboard Parallax — Reduce layers

**Before:**
- 4 `useTransform` + 1 `useSpring` scroll handlers running simultaneously
- `y1`, `y2`, `y3`, `rotate` all active

**After:**
- Mobile (<768px): Disable all scroll transforms — static layout
- Tablet (768px-1023px): Reduce to 1 transform (`y = v * 0.05`)
- Desktop: Keep 2 transforms max (`y1`, `rotate`), remove `y2`, `y3`

**Files:** `components/landing/hero-preview.tsx` (lines ~103-113)

---

### 8. Cursor Trail Animation — CSS only

**Before:**
- Framer Motion `animate={{ x: [...], y: [...] }}` with 8s duration, `repeat: Infinity`

**After:**
- Remove Framer Motion wrapper
- CSS `@keyframes` with `animation: cursorTrail 8s linear infinite`
- Keep Framer for entrance animation only

**Files:** `components/landing/hero-preview.tsx` (lines ~464-485), `app/globals.css`

---

### 9. Task Card Hover Effects

**Before:**
- `motion.div whileHover={{ y: -4, scale: 1.02 }}` per card
- ~6 animated task cards rendered

**After:**
- Static `div` with CSS `transition: transform 0.2s`
- Hover state via CSS class: `hover:-translate-y-1 hover:scale-[1.02]`

**Files:** `components/landing/hero-preview.tsx` (lines ~32-39)

---

## Global: Performance Guards

### 10. `prefers-reduced-motion` Support

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

In components: use `useReducedMotion()` from Framer Motion to disable:
- All continuous animations
- Scroll-linked parallax transforms
- GSAP ScrollTrigger initialization

**Files:** `app/globals.css`, `components/landing/hero-section.tsx`, `components/landing/hero-preview.tsx`

---

### 11. Image Optimization

All Unsplash avatar images:
```tsx
<Image
  src={person.img}
  alt={person.alt}
  width={40}
  height={40}
  loading="lazy"
  decoding="async"
  sizes="40px"
  className="w-full h-full object-cover"
/>
```

**Files:** `components/landing/hero-section.tsx` (lines ~265-271)

---

## What Stays the Same

- Full visual design (colors, gradients, typography, spacing)
- GSAP ScrollTrigger on desktop (pinned scroll effect preserved for ≥768px)
- Floating dashboard card aesthetic
- All hover states and interactive elements (implemented via CSS, not Framer)
- Trust badge, CTA buttons, social proof sections
- Hero section layout and structure

---

## Files to Modify

1. `components/landing/hero-section.tsx` — Gradient orbs, animated text, continuous animations, avatars
2. `components/landing/hero-preview.tsx` — Floating cards, parallax, GSAP conditional, cursor trail, task cards
3. `app/globals.css` — Add `prefers-reduced-motion` media query, CSS keyframes for pulse/hover animations

---

## Acceptance Criteria

1. **Initial Load:** Hero section first paint < 1.5s on 4G connection
2. **LCP:** Largest Contentful Paint < 2.5s
3. **Scroll Performance:** 60fps during hero-to-preview transition on mid-tier mobile (Pixel 4 equivalent)
4. **JS Bundle:** No net increase in JS bundle size (optimizations offset any new code)
5. **Accessibility:** `prefers-reduced-motion` fully respected — no animation for users who prefer it
6. **Visual:** Identical visual output to current design on desktop Chrome

---

## Dependencies

- `framer-motion` — retained for entrance animations and reduced-motion hook
- `gsap` with `ScrollTrigger` — retained for desktop pin/scroll effect
- No new dependencies required
