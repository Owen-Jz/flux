# Hero Section Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize hero and hero-preview sections for faster initial load, smoother scroll transitions, and reduced memory/CPU usage on less powerful devices — while preserving the existing visual design.

**Architecture:** Replace continuous Framer Motion JS animations with CSS @keyframes, add mobile-conditional loading for heavy effects (GSAP, parallax), and reduce per-element motion spans. All changes are additive refactoring with no visual design changes.

**Tech Stack:** Framer Motion (selective use), GSAP + ScrollTrigger (desktop-only), CSS animations, Next.js Image optimization.

---

## Files to Modify

| File | Responsibility |
|------|---------------|
| `components/landing/hero-section.tsx` | Gradient orbs, animated text, continuous animations, avatars |
| `components/landing/hero-preview.tsx` | Floating cards, parallax layers, GSAP conditional, cursor trail, task card hovers |
| `app/globals.css` | Add `prefers-reduced-motion` media query, CSS keyframes for pulse/scroll/cursor |

---

## Task 1: Add CSS Keyframes and Reduced Motion Support

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current globals.css to find insertion point**

Run: Read `app/globals.css` (first 50 lines to understand structure)

- [ ] **Step 2: Add CSS keyframes for hero animations**

Append to end of `app/globals.css`:

```css
/* Hero section continuous animations - CSS only (zero JS overhead) */
@keyframes heroPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

@keyframes heroScrollBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

@keyframes heroArrowBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

@keyframes heroScrollDot {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(16px); opacity: 0.5; }
}

/* Hero preview cursor trail - CSS only */
@keyframes cursorTrail {
  0% { transform: translate(280px, 160px); }
  25% { transform: translate(340px, 120px); }
  50% { transform: translate(280px, 160px); }
  75% { transform: translate(340px, 120px); }
  100% { transform: translate(280px, 160px); }
}

/* Floating card ambient animations - CSS only */
@keyframes floatCard1 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes floatCard2 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "perf: add CSS keyframes for hero animations, add prefers-reduced-motion support
\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Optimize Gradient Orbs — Remove Blur

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 32-51)

- [ ] **Step 1: Read the current GradientOrbs component**

Run: Read `components/landing/hero-section.tsx` lines 32-51

- [ ] **Step 2: Replace GradientOrbs with blur-free version**

Replace the existing `GradientOrbs` function (lines 32-51) with:

```tsx
// Static gradient orbs - no blur, uses opacity layering instead
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Light mode - opacity layering instead of blur */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[var(--brand-primary)]/30 via-[var(--info-primary)]/15 to-transparent rounded-full" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--info-primary)]/25 via-[var(--brand-secondary)]/15 to-transparent rounded-full" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-[var(--brand-secondary)]/25 via-[var(--brand-primary)]/15 to-transparent rounded-full" />
      {/* Dark mode - slightly more opacity */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[var(--brand-primary)]/25 via-[var(--info-primary)]/20 to-transparent rounded-full hidden dark:block" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--info-primary)]/30 via-[var(--brand-secondary)]/15 to-transparent rounded-full hidden dark:block" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-[var(--brand-secondary)]/25 via-[var(--brand-primary)]/20 to-transparent rounded-full hidden dark:block" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero-section.tsx
git commit -m "perf(hero): replace blur orbs with opacity layering, remove GPU-intensive blur filters
\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Simplify AnimatedText — Reduce Motion Spans

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 69-92, 177-193)

- [ ] **Step 1: Read the AnimatedText component**

Run: Read `components/landing/hero-section.tsx` lines 69-92

- [ ] **Step 2: Replace AnimatedText with simplified version**

Replace the existing `AnimatedText` function (lines 69-92) with:

```tsx
// Simplified animated text - reduces per-word spans, removes 3D rotateX
function AnimatedText({ text, className, delay = 0, animateWords = true }: { text: string; className?: string; delay?: number; animateWords?: boolean }) {
  const words = text.split(" ");

  if (!animateWords) {
    // Single span with opacity-only animation for secondary lines
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        className={className}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.05,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
```

- [ ] **Step 3: Update the headline usage**

Read lines 177-193 to find the `<AnimatedText>` usages in the `<h1>`, then verify the component accepts the new `animateWords` prop. The second line "your team in flow" should pass `animateWords={false}`.

Current usage (lines 183, 187):
```tsx
<AnimatedText text="Ship faster with" delay={0.1} />
...
<span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--info-primary)] to-[var(--brand-primary)] bg-[length:200%_auto] animate-gradient">
  <AnimatedText text="your team in flow" />
</span>
```

Update to:
```tsx
<AnimatedText text="Ship faster with" delay={0.1} animateWords={true} />
...
<span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--info-primary)] to-[var(--brand-primary)] bg-[length:200%_auto] animate-gradient">
  <AnimatedText text="your team in flow" delay={0.6} animateWords={false} />
</span>
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-section.tsx
git commit -m "perf(hero): simplify AnimatedText - reduce per-word spans, remove rotateX 3D transform\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Replace Trust Badge Pulse with CSS Animation

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 154-160)

- [ ] **Step 1: Read trust badge pulse animation**

Run: Read `components/landing/hero-section.tsx` lines 154-160

- [ ] **Step 2: Replace Framer Motion pulse with CSS class**

Find the `<motion.span` with `animate={{ scale: [1, 1.2, 1] }}` and replace with a static span with a CSS class:

Replace (lines 156-160):
```tsx
<motion.span
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="w-2 h-2 rounded-full bg-[var(--brand-primary)]"
/>
```

With:
```tsx
<span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] hero-pulse" />
```

- [ ] **Step 3: Add heroPulse animation to globals.css**

Append to `app/globals.css`:

```css
/* Trust badge pulse dot */
.hero-pulse {
  animation: heroPulse 2s ease-in-out infinite;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-section.tsx app/globals.css
git commit -m "perf(hero): replace trust badge pulse Framer Motion with CSS animation\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Replace CTA Arrow Bounce with CSS Animation

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 220-225)

- [ ] **Step 1: Read the arrow icon animation**

Run: Read `components/landing/hero-section.tsx` lines 220-225

- [ ] **Step 2: Replace Framer Motion arrow bounce with CSS**

Find:
```tsx
<motion.span
  animate={{ x: [0, 4, 0] }}
  transition={{ duration: 1.5, repeat: Infinity }}
>
  <ArrowRightIcon className="w-5 h-5" />
</motion.span>
```

Replace with:
```tsx
<span className="hero-arrow-bounce">
  <ArrowRightIcon className="w-5 h-5" />
</span>
```

- [ ] **Step 3: Add heroArrowBounce CSS to globals.css**

Append to `app/globals.css`:

```css
/* CTA arrow icon bounce */
.hero-arrow-bounce {
  display: inline-flex;
  animation: heroArrowBounce 1.5s ease-in-out infinite;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-section.tsx app/globals.css
git commit -m "perf(hero): replace CTA arrow bounce Framer Motion with CSS animation\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Replace Scroll Indicator with CSS Animation

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 302-322)

- [ ] **Step 1: Read scroll indicator animation**

Run: Read `components/landing/hero-section.tsx` lines 302-322

- [ ] **Step 2: Replace Framer Motion scroll dot with CSS**

Find the `motion.div` wrapping the scroll indicator dot (contains `animate={{ y: [0, 16, 0] }}`). Replace the entire scroll indicator section with:

```tsx
{/* Scroll indicator - CSS animated */}
<div className="absolute bottom-8 left-1/2 -translate-x-1/2">
  <div className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]">
    <span className="text-xs font-medium uppercase tracking-widest">Scroll to explore</span>
    <div className="w-6 h-10 rounded-full border-2 border-[var(--border-default)] flex items-start justify-center p-1">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] hero-scroll-dot" />
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add heroScrollDot CSS to globals.css**

Append to `app/globals.css`:

```css
/* Scroll indicator dot animation */
.hero-scroll-dot {
  animation: heroScrollDot 1.5s ease-in-out infinite;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-section.tsx app/globals.css
git commit -m "perf(hero): replace scroll indicator Framer Motion with CSS animation\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Optimize Social Proof Avatars — CSS Hover + Lazy Loading

**Files:**
- Modify: `components/landing/hero-section.tsx` (lines 248-276)

- [ ] **Step 1: Read the avatar section**

Run: Read `components/landing/hero-section.tsx` lines 248-276

- [ ] **Step 2: Replace motion.div wrappers with CSS transition**

Replace the avatar `motion.div` wrappers. Find each `motion.div` with `whileHover={{ scale: 1.2, zIndex: 10 }}` and replace with:

```tsx
<div className="w-10 h-10 rounded-full border-3 border-[var(--surface)] overflow-hidden cursor-pointer shadow-md hover:scale-110 hover:z-10 transition-transform duration-200">
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
</div>
```

Apply this to all 5 avatar divs (remove the outer `motion.div` wrappers but keep the `Image` inside).

- [ ] **Step 3: Add avatar hover CSS to globals.css if needed**

The `hover:scale-110 hover:z-10 transition-transform duration-200` Tailwind classes should handle it. No extra CSS needed.

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-section.tsx
git commit -m "perf(hero): replace avatar hover Framer Motion with CSS, add loading=lazy to images\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Reduce Floating Cards on Mobile — Hero Preview

**Files:**
- Modify: `components/landing/hero-preview.tsx` (lines 118-167)

- [ ] **Step 1: Read the floating card section**

Run: Read `components/landing/hero-preview.tsx` lines 118-167

- [ ] **Step 2: Replace floating cards with responsive versions**

Replace the two `motion.div` containers for floating cards (lines 118-144 and 146-167) with conditional rendering:

Replace first card (lines 118-144):
```tsx
{/* Background floating card - Light mode - Desktop only */}
<div className="absolute -left-4 lg:-left-16 top-8 w-[120px] md:w-[200px] lg:w-[320px] hidden md:block">
  <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-2xl float-card-1">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-3 h-3 rounded-full bg-red-400/60" />
      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
      <div className="w-3 h-3 rounded-full bg-green-400/60" />
    </div>
    <div className="space-y-2">
      <div className="h-2 w-3/4 bg-[var(--border-subtle)] rounded" />
      <div className="h-2 w-1/2 bg-[var(--background-subtle)] rounded" />
      <div className="flex gap-2 mt-3">
        <div className="h-12 flex-1 bg-[var(--background-subtle)] rounded" />
        <div className="h-12 flex-1 bg-[var(--background-subtle)] rounded" />
      </div>
    </div>
  </div>
</div>
```

Replace second card (lines 146-167):
```tsx
{/* Background floating card 2 - Desktop + Tablet only (1 card on tablet) */}
<div className="absolute -right-2 md:-right-4 lg:-right-16 top-20 w-[100px] md:w-[180px] lg:w-[280px] hidden lg:block">
  <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-2xl float-card-2">
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/20" />
          <div className="h-2 flex-1 bg-[var(--background-subtle)] rounded" />
        </div>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add float card CSS animations to globals.css**

Append to `app/globals.css`:

```css
/* Floating card ambient animations - replaces Framer Motion infinite loops */
.float-card-1 {
  animation: floatCard1 4s ease-in-out infinite;
}

.float-card-2 {
  animation: floatCard2 5s ease-in-out infinite;
  animation-delay: 0.5s;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-preview.tsx app/globals.css
git commit -m "perf(hero-preview): replace floating card Framer loops with CSS, responsive card counts\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Reduce Dashboard Parallax Layers on Mobile

**Files:**
- Modify: `components/landing/hero-preview.tsx` (lines 103-113)

- [ ] **Step 1: Read the parallax setup**

Run: Read `components/landing/hero-preview.tsx` lines 103-113

- [ ] **Step 2: Add useReducedMotion hook and conditional parallax**

Replace the `FloatingDashboard` function's parallax setup (lines 103-113) with:

```tsx
// Floating dashboard preview with conditional parallax based on device
function FloatingDashboard({ scrollY }: { scrollY: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference and device capability
  const prefersReducedMotion = useReducedMotion() === true;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only enable parallax on desktop with reduced motion off
  const y1 = (!prefersReducedMotion && !isMobile) ? useTransform(scrollY, (v) => v * 0.12) : useTransform(() => 0);
  const rotate = (!prefersReducedMotion && !isMobile) ? useTransform(scrollY, (v) => v * 0.015) : useTransform(() => 0);

  // Simple static entrance for mobile - no parallax
  const entranceY = useTransform(scrollY, (v) => isMobile ? 0 : v * 0.08);
  const springY = useSpring(entranceY, { stiffness: 100, damping: 30 });
```

Note: `useReducedMotion` must be imported from framer-motion. Verify import at top of file (line 4) includes it.

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero-preview.tsx
git commit -m "perf(hero-preview): reduce parallax transforms on mobile, respect prefers-reduced-motion\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Replace Cursor Trail with CSS Animation

**Files:**
- Modify: `components/landing/hero-preview.tsx` (lines 464-485)

- [ ] **Step 1: Read cursor trail animation**

Run: Read `components/landing/hero-preview.tsx` lines 464-485

- [ ] **Step 2: Replace Framer cursor trail with CSS**

Replace the `motion.div` cursor (lines 464-485) with:

```tsx
{/* Simple cursor - CSS animated, no Framer overhead */}
<div className="absolute top-0 left-0 z-30 pointer-events-none cursor-trail">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z"
      fill="var(--text-primary)"
      stroke="var(--text-inverse)"
      strokeWidth="1"
    />
  </svg>
</div>
```

- [ ] **Step 3: Add cursor trail CSS to globals.css**

Append to `app/globals.css`:

```css
/* Cursor trail animation - CSS only */
.cursor-trail {
  animation: cursorTrail 8s linear infinite;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/hero-preview.tsx app/globals.css
git commit -m "perf(hero-preview): replace cursor trail Framer Motion with CSS animation\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Replace Task Card Hover Effects with CSS

**Files:**
- Modify: `components/landing/hero-preview.tsx` (lines 32-39)

- [ ] **Step 1: Read the AnimatedTaskCard component**

Run: Read `components/landing/hero-preview.tsx` lines 14-100

- [ ] **Step 2: Remove motion.div whileHover from AnimatedTaskCard**

In `AnimatedTaskCard`, replace the outer `motion.div` (lines 33-39) with a regular div:

Replace (lines 33-39):
```tsx
<motion.div
  ref={ref}
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay, duration: 0.5 }}
  whileHover={{ y: -4, scale: 1.02 }}
  className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-md cursor-pointer group"
>
```

With:
```tsx
<div
  ref={ref}
  className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-md cursor-pointer group hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200"
>
```

Keep the initial render animation (`initial`, `animate`, `transition`) - those are fine since they only run once on mount. Only remove the continuous `whileHover`.

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero-preview.tsx
git commit -m "perf(hero-preview): replace task card hover Framer Motion with CSS transition\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Make GSAP ScrollTrigger Mobile Conditional

**Files:**
- Modify: `components/landing/hero-preview.tsx` (lines 497-518)

- [ ] **Step 1: Read the GSAP ScrollTrigger setup**

Run: Read `components/landing/hero-preview.tsx` lines 497-518

- [ ] **Step 2: Wrap GSAP initialization in mobile check**

Replace the `useEffect` in `HeroPreviewSection` (lines 497-518) with:

```tsx
useEffect(() => {
  if (!sectionRef.current || !contentRef.current) return;

  // Only initialize GSAP on desktop (768px+)
  if (typeof window === 'undefined' || window.innerWidth < 768) {
    // On mobile, just show the content immediately with simple fade
    gsap.set(contentRef.current, { opacity: 1, y: 0 });
    return;
  }

  const ctx = gsap.context(() => {
    // Fade in the background as the section comes into view
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 80%",
      onEnter: () => {
        gsap.to(contentRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      },
      once: true
    });
  }, sectionRef);

  return () => ctx.revert();
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero-preview.tsx
git commit -m "perf(hero-preview): make GSAP ScrollTrigger desktop-only, skip on mobile\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Verify All Imports and Final Review

**Files:**
- Review: `components/landing/hero-section.tsx`
- Review: `components/landing/hero-preview.tsx`

- [ ] **Step 1: Verify hero-section imports**

Run: Read `components/landing/hero-section.tsx` lines 1-15

Check that `motion` and `useScroll` are still used (don't remove imports that are still needed for entrance animations).

- [ ] **Step 2: Verify hero-preview imports**

Run: Read `components/landing/hero-preview.tsx` lines 1-12

Ensure `useReducedMotion` is imported from framer-motion (line 4 should include it).

- [ ] **Step 3: Build verification**

Run: `cd "C:/Users/owen/downloads/projects/flux" && npm run build 2>&1 | head -50`

Expected: No TypeScript errors, successful build

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: complete hero performance optimization - all tasks
\n- Replace continuous Framer Motion loops with CSS @keyframes
- Add prefers-reduced-motion support
- Mobile-conditional parallax and GSAP
- Lazy load avatar images
- Reduce AnimatedText spans
- Remove blur from gradient orbs
\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Spec Coverage Check

| Spec Item | Task(s) |
|-----------|---------|
| Gradient orbs blur removal | Task 2 |
| AnimatedText span reduction | Task 3 |
| Continuous animations CSS | Tasks 4, 5, 6 |
| Avatar CSS hover + lazy load | Task 7 |
| Floating cards mobile reduction | Task 8 |
| Parallax layer reduction | Task 9 |
| GSAP mobile conditional | Task 12 |
| Cursor trail CSS | Task 10 |
| Task card hover CSS | Task 11 |
| prefers-reduced-motion | Task 1 |

All spec items covered. No gaps.
