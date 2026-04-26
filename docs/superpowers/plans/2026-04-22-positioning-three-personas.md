# Landing Page Positioning: Three-Persona Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Flux landing page to serve three distinct personas: Team Collaboration, Freelancer-to-Client Management, and Personal Management.

**Architecture:** This plan adds a new "Who it's for" section, updates the hero subheadline to include all three personas, adds freelancer/solo testimonials, adds a personal-use FAQ, and updates pricing descriptions to explicitly mention solo usage. All changes are additive—existing team-focused copy is preserved but supplemented.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion, Heroicons

---

## Files

- Create: `components/landing/who-its-for-section.tsx`
- Modify: `components/landing/hero-section.tsx`
- Modify: `components/landing/testimonials-section.tsx`
- Modify: `components/landing/faq-section.tsx`
- Modify: `components/landing/pricing-section.tsx`
- Modify: `app/page.tsx`

---

## Task 0: Hero Headline Carousel (Teams / Freelancers / Solo)

**Files:**
- Modify: `components/landing/hero-section.tsx`

- [ ] **Step 1: Add persona headlines array and state**

At the top of the file, find the `fadeInUp` animation definition (around line 16). Add the carousel headlines after the existing animation constants:

```tsx
// Rotating hero headlines — one per persona
const heroHeadlines = [
  {
    persona: "Teams",
    line1: "Your team, finally",
    line2: "in sync",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    persona: "Freelancers",
    line1: "Clients, always",
    line2: "in the loop",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    persona: "Solo",
    line1: "Your goals, finally",
    line2: "in sight",
    gradient: "from-emerald-500 to-teal-500",
  },
];
```

- [ ] **Step 2: Add carousel state and interval effect to HeroSection**

In `HeroSection`, add `useState` and `useEffect` imports. Find the `containerRef` declaration and add state and timer after it:

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const heroContentRef = useRef<HTMLDivElement>(null);
const { scrollY } = useScroll();

// Carousel state
const [headlineIndex, setHeadlineIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setHeadlineIndex((prev) => (prev + 1) % heroHeadlines.length);
  }, 3500);
  return () => clearInterval(interval);
}, []);
```

- [ ] **Step 3: Replace static headline with animated carousel version**

Find the existing `<motion.h1>` block (lines 207-220):

```tsx
<motion.h1
  id="hero-heading"
  variants={fadeInUp}
  className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[var(--text-primary)] leading-[1.02] mb-8 tracking-tight max-w-5xl perspective-1000"
>
  <AnimatedText text="Your team, finally" delay={0.1} animateWords={true} />
  <br />
  <span className="relative inline-block">
    <AnimatedText text="in sync" delay={0.6} animateWords={false} />
    <svg className="absolute -bottom-3 left-0 w-full h-5 text-[var(--brand-primary)]/30 -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
      <path d="M2 15 Q 50 5 100 12 T 198 10" stroke="currentColor" strokeWidth="8" fill="none" />
    </svg>
  </span>
</motion.h1>
```

Replace it with:

```tsx
<motion.h1
  id="hero-heading"
  variants={fadeInUp}
  className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[var(--text-primary)] leading-[1.02] mb-8 tracking-tight max-w-5xl perspective-1000"
>
  {/* Persona badge */}
  <motion.span
    key={`badge-${headlineIndex}`}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${heroHeadlines[headlineIndex].gradient} text-white shadow-lg`}
  >
    {heroHeadlines[headlineIndex].persona}
  </motion.span>

  {/* Line 1 — fades between headlines */}
  <span className="block relative">
    <AnimatePresence mode="wait">
      <motion.span
        key={`line1-${headlineIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {heroHeadlines[headlineIndex].line1}
      </motion.span>
    </AnimatePresence>
  </span>

  {/* Line 2 with underline SVG */}
  <span className="relative inline-block">
    <AnimatePresence mode="wait">
      <motion.span
        key={`line2-${headlineIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {heroHeadlines[headlineIndex].line2}
      </motion.span>
    </AnimatePresence>
    <svg className="absolute -bottom-3 left-0 w-full h-5 text-[var(--brand-primary)]/30 -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
      <path d="M2 15 Q 50 5 100 12 T 198 10" stroke="currentColor" strokeWidth="8" fill="none" />
    </svg>
  </span>
</motion.h1>
```

- [ ] **Step 4: Import AnimatePresence**

Find the framer-motion import at the top of the file:
```tsx
import { motion, useScroll } from "framer-motion";
```

Update to:
```tsx
import { motion, useScroll, AnimatePresence } from "framer-motion";
```

- [ ] **Step 5: Commit**

```bash
git add components/landing/hero-section.tsx
git commit -m "feat(landing): add rotating headline carousel for three-persona positioning"
```

---

## Task 1: Add "Who It's For" Section

**Files:**
- Create: `components/landing/who-its-for-section.tsx`
- Modify: `app/page.tsx:322-324` (insert new section before Features section)

- [ ] **Step 1: Create the WhoIt'sForSection component**

```tsx
"use client";

import { motion } from "framer-motion";
import { UsersIcon, BriefcaseIcon, UserIcon } from "@heroicons/react/24/outline";

const personas = [
    {
        icon: UsersIcon,
        title: "Teams",
        headline: "Collaborate without the chaos",
        description: "See what everyone's working on in real-time. Stop stepping on each other's toes.",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        icon: BriefcaseIcon,
        title: "Freelancers & Agencies",
        headline: "Manage clients with confidence",
        description: "Share progress without chaos. Keep clients informed and happy without endless status calls.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        icon: UserIcon,
        title: "Solo Professionals",
        headline: "Your work, organized",
        description: "Personal task management that actually works. No team required—just you and your goals.",
        gradient: "from-emerald-500 to-teal-500",
    },
];

export function WhoItsForSection() {
    return (
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background)]" aria-labelledby="who-its-for-heading">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                        Who it's for
                    </span>
                    <h2 id="who-its-for-heading" className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        Built for how you actually work
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Whether you're a growing team, a solo freelancer, or just trying to get your own work together—Flux adapts to you.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {personas.map((persona, index) => (
                        <motion.div
                            key={persona.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.12, duration: 0.5 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative p-6 lg:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                <persona.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{persona.title}</h3>
                            <p className="text-sm font-semibold text-[var(--brand-primary)] mb-4">{persona.headline}</p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{persona.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Import WhoItsForSection in app/page.tsx**

Find this line in `app/page.tsx`:
```tsx
import { CTASection } from '@/components/landing/cta-section';
```

Add after it:
```tsx
import { WhoItsForSection } from '@/components/landing/who-its-for-section';
```

- [ ] **Step 3: Insert section in page layout**

In `app/page.tsx`, find the Features section at line ~309:
```tsx
{/* Features */}
<section id="features" className="py-16 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
```

Add the new section before it:
```tsx
{/* Who it's for */}
<WhoItsForSection />

{/* Features */}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/who-its-for-section.tsx app/page.tsx
git commit -m "feat(landing): add Who it's for section with three-persona positioning"
```

---

## Task 2: Update Hero Subheadline

**Files:**
- Modify: `components/landing/hero-section.tsx:222-229`

- [ ] **Step 1: Update the hero subheadline text**

In `components/landing/hero-section.tsx`, find:
```tsx
<motion.p
  variants={fadeInUp}
  className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed"
>
  Stop switching between tools. See what everyone's working on in real-time.
  No more missed updates, no more dropped threads—just your team moving fast.
</motion.p>
```

Replace with:
```tsx
<motion.p
  variants={fadeInUp}
  className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed"
>
  Stop switching between tools. See what everyone's working on in real-time—whether it's your team, your clients, or just your own goals.
</motion.p>
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-section.tsx
git commit -m "feat(landing): broaden hero subheadline to cover all three personas"
```

---

## Task 3: Add Freelancer & Solo Testimonials

**Files:**
- Modify: `components/landing/testimonials-section.tsx:7-29`

- [ ] **Step 1: Update testimonials array to include freelancer and solo user voices**

In `components/landing/testimonials-section.tsx`, replace the testimonials array:
```tsx
const testimonials = [
    {
        quote: "We actually shipped our Q4 roadmap on time for the first time in years. Flux just... works.",
        author: "Sarah Jenkins",
        role: "CTO at TechFlow",
        avatar: "SJ",
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        quote: "I stopped getting 'I didn't know that was done' messages. That alone was worth it.",
        author: "Michael Chen",
        role: "Product Lead at Apex",
        avatar: "MC",
        gradient: "from-purple-500 to-pink-500"
    },
    {
        quote: "The moment my team saw each other's cursors on the board, they got it. No training needed.",
        author: "Jessica Williams",
        role: "Engineering Manager at Bolt",
        avatar: "JW",
        gradient: "from-purple-500 to-teal-500"
    },
    {
        quote: "I send my clients a link and they can see exactly where projects stand. Fewer meetings, happier clients.",
        author: "Alex Rivera",
        role: "Freelance Designer",
        avatar: "AR",
        gradient: "from-amber-500 to-orange-500"
    },
    {
        quote: "As a solo founder, I needed something that worked for me—not a team tool forced into solo use. Flux is that.",
        author: "Sam Patel",
        role: "Indie Hacker",
        avatar: "SP",
        gradient: "from-emerald-500 to-teal-500"
    },
    {
        quote: "The client portal view alone changed how I run my agency. Professional without the overhead.",
        author: "Jordan Kim",
        role: "Agency Owner",
        avatar: "JK",
        gradient: "from-rose-500 to-pink-500"
    }
];
```

- [ ] **Step 2: Update section heading and subheading**

Find:
```tsx
<h2
  id="testimonials-heading"
  ...
>
  Teams that made the switch
</h2>
```

Replace with:
```tsx
<h2
  id="testimonials-heading"
  ...
>
  From teams to solo founders
</h2>
```

And:
```tsx
<p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
  Real teams, real results. Here's what happens when you stop the chaos.
</p>
```

Replace with:
```tsx
<p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
  Teams, freelancers, and solo builders. Here's what happens when you stop the chaos.
</p>
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/testimonials-section.tsx
git commit -m "feat(landing): add freelancer and solo testimonials to broaden persona coverage"
```

---

## Task 4: Add Personal/Freelancer FAQ Items

**Files:**
- Modify: `components/landing/faq-section.tsx:8-33`

- [ ] **Step 1: Update FAQs array to include personal and freelancer questions**

In `components/landing/faq-section.tsx`, replace the faqs array:
```tsx
const faqs = [
    {
        question: "Is Flux free to use?",
        answer: "Yes, our Free plan is completely free forever for individuals. It includes unlimited tasks and up to 3 projects."
    },
    {
        question: "Can I use Flux as a solo user?",
        answer: "Absolutely. Many of our most dedicated users are solo professionals—freelancers, indie hackers, and personal productivity enthusiasts. The Free plan has everything you need to stay organized."
    },
    {
        question: "Can I share project progress with clients?",
        answer: "Yes. With every plan, you can share a public link to a board so clients can see progress without needing to log in or be invited."
    },
    {
        question: "Can I import data from other tools?",
        answer: "Absolutely. We offer one-click imports from Jira, Trello, and Asana so you can switch tools without losing any context."
    },
    {
        question: "How secure is my data?",
        answer: "Super secure. Your data is encrypted, protected, and we undergo regular security reviews. Think bank-level protection."
    },
    {
        question: "Do you offer discounts for non-profits?",
        answer: "Yes! We offer a 50% discount on all paid plans for verified non-profit organizations and educational institutions."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans. All payments are processed securely through Stripe."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
    }
];
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/faq-section.tsx
git commit -m "feat(landing): add solo user and client sharing FAQ items"
```

---

## Task 5: Update Pricing Descriptions

**Files:**
- Modify: `components/landing/pricing-section.tsx:7-79`

- [ ] **Step 1: Update pricing plan descriptions to explicitly mention solo usage**

In `components/landing/pricing-section.tsx`, update each plan description:

Free plan:
```tsx
description: "For individuals who want to get organized. Completely free, no credit card needed.",
```

Starter plan:
```tsx
description: "Perfect for small teams or solo freelancers managing client work.",
```

Pro plan:
```tsx
description: "For growing agencies and teams that need more flexibility and client-facing features.",
```

Enterprise plan:
```tsx
description: "For organizations that need dedicated support, custom solutions, and enterprise security.",
```

- [ ] **Step 2: Update team member labels to be persona-aware**

In the features lists, update the Starter plan features:
```tsx
"Up to 10 Active Members",
```

Pro plan:
```tsx
"Up to 25 Active Members",
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/pricing-section.tsx
git commit -m "feat(landing): update pricing descriptions to highlight solo and freelancer use cases"
```

---

## Self-Review Checklist

- [ ] Task 0: Carousel cycles through all 3 personas with smooth AnimatePresence transitions
- [ ] Task 0: Each persona badge shows correct gradient color matching the headline
- [ ] All three personas (Teams, Freelancers, Solo) appear across at least 2 sections each
- [ ] No placeholder text ("TBD", "TODO") in any of the new content
- [ ] All testimonials have distinct gradient colors and realistic roles
- [ ] FAQ answers specifically mention solo/freelancer use cases where relevant
- [ ] Hero subheadline change is subtle but inclusive of all three personas
- [ ] WhoIt'sFor section has distinct icons per persona
- [ ] All sections use consistent Tailwind variable references (`var(--text-primary)`, etc.)
- [ ] Commit messages follow conventional format: `feat(landing): ...`

---

## Summary of Changes

| # | Section | Change |
|---|---------|--------|
| 0 | `hero-section.tsx` | Rotating headline carousel — cycles Teams / Freelancers / Solo every 3.5s with persona badge |
| 1 | `app/page.tsx` + `who-its-for-section.tsx` | **New file** — Three-card "Who it's for" section (Teams, Freelancers & Agencies, Solo) before Features |
| 2 | `hero-section.tsx` | Subheadline now mentions "team, clients, or your own goals" |
| 3 | `testimonials-section.tsx` | Added 3 testimonials (freelancer designer, indie hacker, agency owner), updated heading to "From teams to solo founders" |
| 4 | `faq-section.tsx` | Added 2 FAQs (solo usage, client sharing) |
| 5 | `pricing-section.tsx` | Updated descriptions to highlight solo and freelancer use cases |

**Total: 1 new file, 6 modified files, 1 commit per task = 6 commits**
