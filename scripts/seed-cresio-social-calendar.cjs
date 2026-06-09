/**
 * Seed the Cresio Labs social media content calendar.
 *
 * - Resolves the CresioLabs workspace + Social Media board by slug (no hardcoded IDs).
 * - Upserts 8 content-type categories onto the board (legend colors) and color-codes each task.
 * - Wipes existing `content-calendar`-tagged tasks on the board, then recreates all 16.
 * - Each task carries finished, platform-tailored captions (LinkedIn / Instagram / Twitter/X)
 *   in its description, plus a one-line image direction and carousel slide list.
 * - Sets BOTH `scheduledDate` (board content calendar) and `dueDate` (workspace calendar).
 *
 * Re-runnable / idempotent. Usage:  node scripts/seed-cresio-social-calendar.cjs
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// ── Content-type → category color (from the plan's legend) ──────────────────
const CATEGORY_COLORS = {
  'Thought Leadership': '#2E7D32',
  'Tips & Tricks': '#283593',
  'Case Study': '#1565C0',
  'Announcement': '#F57F17',
  'Behind the Scenes': '#6A1B9A',
  'Educational': '#00838F',
  'Testimonial': '#00695C',
  'Engagement': '#C62828',
};

// Publish-window helper notes
const W_LI = 'LinkedIn Tue–Thu 8–10am';
const W_IG = 'Instagram 11am–1pm or 7–9pm';
const W_ALL = 'LinkedIn 8–10am · Instagram 11am–1pm · X 12–1pm / 5–6pm';

// ── The 16 posts ────────────────────────────────────────────────────────────
const POSTS = [
  {
    date: '2026-06-09', week: 'week-1', title: 'Why Most SaaS Brands Get Visual Identity Wrong',
    type: 'thought-leadership', category: 'Thought Leadership', pillar: 'Thought Leadership',
    format: 'single post', platforms: ['linkedin'], priority: 'MEDIUM', publish: W_LI,
    image: 'Clean white background, bold black headline, orange accent underline — text-led, no imagery.',
    captions: {
      linkedin: `Most SaaS brands are invisible — and they don't even know it.

Same blues. Same gradient blobs. Same stock photos of people pointing at whiteboards. When every competitor looks identical, "looking professional" is just camouflage.

Standing out was never about being louder. It's about being clear: one sharp point of view, expressed consistently, everywhere a customer touches you.

If your homepage could swap logos with three competitors and nobody would notice — that's the first thing to fix.

What's the biggest brand identity mistake you've seen (or made)? 👇

#CresioLabs #BrandDesign #SaaS`,
    },
  },
  {
    date: '2026-06-11', week: 'week-1', title: '5 Rules We Follow for Every Landing Page We Build',
    type: 'tips-and-tricks', category: 'Tips & Tricks', pillar: 'Product Value',
    format: 'carousel 7 slides', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'HIGH', publish: W_ALL,
    image: 'Carousel cover: white BG, bold headline, orange underline, "SWIPE →". Consistent orange rule-number circles across slides 2–6.',
    slides: [
      'Cover: 5 Rules for Every Landing Page We Build',
      'Rule 1: One Job Per Page — one goal, one CTA',
      'Rule 2: Headline in 7 Words or Less (before/after rewrite)',
      'Rule 3: CTA Above the Fold — always (wireframe)',
      'Rule 4: Strip Every Form Field You Don\'t Need (7→4 = +31%)',
      'Rule 5: Social Proof Near the CTA (stars + logos)',
      'CTA: Save this + follow @CresioLabs',
    ],
    captions: {
      linkedin: `Before we write a single line of code, we answer five questions. The answers decide everything — copy hierarchy, CTA placement, what gets cut.

The 5 rules we apply to every landing page we build:

1. One job per page — one goal, one CTA.
2. Headline in 7 words or less.
3. CTA above the fold, always.
4. Strip every form field you don't need (we cut one client's from 7 to 4 → +31% signups).
5. Social proof next to the CTA, not buried at the bottom.

None of these are clever. All of them get skipped. That's the opportunity.

Save this for your next redesign sprint →

#CresioLabs #LandingPage #ConversionDesign`,
      instagram: `5 rules we follow for every landing page we build 👇

We answer these before writing a single line of code:

1️⃣ One job per page
2️⃣ Headline in 7 words or less
3️⃣ CTA above the fold — always
4️⃣ Cut every form field you don't need
5️⃣ Social proof next to the CTA

We cut one client's form from 7 fields to 4. Signups jumped 31%.

Save this for your next redesign 🔖
·
·
#CresioLabs #LandingPage #ConversionDesign #WebDesign #UXDesign #CRO #SaaSDesign #ProductDesign`,
      twitter: `5 rules we follow for every landing page we build:

1. One job per page
2. Headline ≤ 7 words
3. CTA above the fold
4. Cut every form field you don't need
5. Social proof next to the CTA

Cut one client's form 7→4 fields. +31% signups. 🧵

#CresioLabs #ConversionDesign`,
    },
  },
  {
    date: '2026-06-12', week: 'week-1', title: 'How We Increased a Client\'s Trial Signups by 47% in 90 Days',
    type: 'case-study', category: 'Case Study', pillar: 'Social Proof',
    format: 'single post', platforms: ['linkedin'], priority: 'HIGH', publish: W_LI,
    image: 'Before/after split — muted grey "before" vs orange-accented "after". Large "47%" in bold orange, center frame.',
    captions: {
      linkedin: `A client came to us with plenty of traffic and almost no signups.

The problem wasn't acquisition. It was friction.

Here's the entire fix:
→ Cut 3 form fields
→ Rewrote the headline around one clear outcome
→ Moved the CTA above the fold

That was it. No new features. No bigger ad budget.

90 days later: trial signups up 47%.

Most "conversion problems" are actually clarity problems. The page asks for too much, too early, and says too little about why it's worth it.

Read the full case study — link in comments.

#CresioLabs #CRO #GrowthDesign`,
    },
  },
  {
    date: '2026-06-16', week: 'week-2', title: 'We Just Shipped a New Design Sprint Framework for Early-Stage Startups',
    type: 'announcement', category: 'Announcement', pillar: 'Product Value',
    format: 'single post', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'HIGH', publish: W_ALL,
    image: 'Product launch card — white BG, "NEW →" orange top-left, product name large, launch date bottom-right in grey.',
    captions: {
      linkedin: `For 18 months we ran this quietly with clients. Today it's a standalone offer.

Our 5-day Design Sprint takes an early-stage startup from "we're not sure what to build" to a clickable, tested prototype — in one week.

Built for speed. Designed for founders who can't wait six weeks for a deck.

Day 1 map → Day 2 sketch → Day 3 decide → Day 4 prototype → Day 5 test with real users.

We're opening a handful of spots this quarter.

DM us "SPRINT" for early access details.

#CresioLabs #DesignSprint #Startups`,
      instagram: `We just shipped something we've refined for 18 months 🚀

A 5-day Design Sprint for early-stage startups.

From "we're not sure what to build" → a tested, clickable prototype. In one week.

🗓 Map → Sketch → Decide → Prototype → Test

Built for speed. Designed for founders.

DM us "SPRINT" for early access 👇
·
·
#CresioLabs #DesignSprint #Startups #ProductDesign #StartupLife #UXDesign #Founders`,
      twitter: `We just made our 5-day Design Sprint a standalone offer.

Early-stage startup → tested, clickable prototype in one week.

Map → Sketch → Decide → Prototype → Test.

Built for speed. Designed for founders.

DM "SPRINT" for early access.
#CresioLabs #DesignSprint`,
    },
  },
  {
    date: '2026-06-17', week: 'week-2', title: 'A Day in Our Design Process — From Brief to First Wireframe',
    type: 'behind-the-scenes', category: 'Behind the Scenes', pillar: 'Brand Culture',
    format: 'carousel 5 slides', platforms: ['instagram'], priority: 'MEDIUM', publish: W_IG,
    image: 'Overhead flat-lay photo (MacBook + blank doc, coffee, notepad) — honest/rough, not stock. Black strip with white headline.',
    slides: [
      'Cover: We don\'t open Figma first. We open a doc.',
      'Hour 1: The Brief Document — what does success look like?',
      'Hour 2: Whiteboard Sketching — no screens, just a marker',
      'Hour 3–4: Low-Fi Wireframe in Figma — grey boxes, no colour',
      'CTA: Follow for more process transparency',
    ],
    captions: {
      instagram: `We don't open Figma first. We open a doc. 📄

Here's what the first 4 hours of a new project actually look like at Cresio Labs:

⏱ Hour 1 — The brief. What does success look like? One metric we're optimizing for.
⏱ Hour 2 — Whiteboard. No screens. Just a marker, hierarchy, 3 rough layouts.
⏱ Hour 3–4 — Low-fi wireframe in Figma. Grey boxes. No colour. Speed over polish.

Great design isn't a burst of inspiration. It's a process you can repeat.

Swipe through how we work → follow for more 🔖
·
·
#CresioLabs #DesignProcess #BehindTheScenes #DesignStudio #UXDesign #Figma #ProductDesign`,
    },
  },
  {
    date: '2026-06-19', week: 'week-2', title: 'The Hierarchy Mistake That Kills Most Product Pages',
    type: 'educational', category: 'Educational', pillar: 'Thought Leadership',
    format: 'carousel 6 slides', platforms: ['linkedin'], priority: 'HIGH', publish: W_LI,
    image: 'Typography-only demonstration — flat same-weight "before" vs bold H1 / medium H2 / light body "after". Big "3×" stat slide.',
    slides: [
      'Cover: The Hierarchy Mistake That Kills Most Product Pages',
      'Before: No Hierarchy — everything same weight, eye has no anchor',
      'Stat: 3× more likely to read a page with clear hierarchy',
      'After: Clear Hierarchy — bold H1, medium H2, light body',
      '3-Level Rule: H1 = promise · H2 = proof · Body = detail',
      'CTA: Screenshot your homepage, squint, fix the blur',
    ],
    captions: {
      linkedin: `If your headline, subhead, and body text are all the same visual weight, your visitor's eye has nowhere to land.

Hierarchy isn't decoration. It's attention management.

Nielsen Norman research: users are ~3× more likely to actually read a page with clear visual hierarchy. When the hierarchy breaks, they don't push through — they leave.

The fix is a 3-level rule on every section:
→ H1 = the promise
→ H2 = the proof
→ Body = the detail

Never collapse them into one tone.

Quick test: screenshot your homepage and squint. If everything blurs into one grey mass, you have a hierarchy problem.

What does your current page hierarchy look like?

#CresioLabs #WebDesign #UXDesign`,
    },
  },
  {
    date: '2026-06-22', week: 'week-3', title: 'Which Design Trend Do You Think Will Die in 2025?',
    type: 'engagement', category: 'Engagement', pillar: 'Brand Culture',
    format: 'single post', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'MEDIUM', publish: W_ALL,
    image: 'Bold question typography on white; oversized orange question mark (120pt); high-contrast, zero clutter.',
    captions: {
      linkedin: `We have a strong opinion about which design trend dies in 2025. But we want yours first.

Our shortlist of suspects:
→ Glassmorphism on everything
→ AI-generated hero blobs
→ Cookie-cutter Linear clones
→ Endless gradient meshes

Trends aren't bad. Copying them six months late is.

Drop your pick below — we'll share ours in the comments and tell you why. 👇

#CresioLabs #DesignTrends #Design2025`,
      instagram: `Which design trend dies in 2025? 💀

We have a strong opinion. But we want yours first.

The suspects:
→ Glassmorphism on everything
→ AI hero blobs
→ Linear clones
→ Gradient mesh overload

Trends aren't the problem. Copying them 6 months late is.

Drop your pick 👇 we'll share ours in the comments.
·
·
#CresioLabs #DesignTrends #Design2025 #GraphicDesign #UIDesign #DesignCommunity #WebDesign`,
      twitter: `Which design trend dies in 2025?

Our suspects:
- Glassmorphism on everything
- AI hero blobs
- Linear clones
- Gradient mesh overload

Trends aren't the problem. Copying them 6 months late is.

Drop your pick 👇
#CresioLabs #DesignTrends`,
    },
  },
  {
    date: '2026-06-23', week: 'week-3', title: '"Working with Cresio Felt Like Having a CMO + Design Team in One" — Founder, Series A SaaS',
    type: 'testimonial', category: 'Testimonial', pillar: 'Social Proof',
    format: 'single post', platforms: ['linkedin'], priority: 'HIGH', publish: W_LI,
    note: 'Replace with a real, attributable client testimonial (e.g. Comraid Shops or NDH) before posting.',
    image: 'White quote card — large light-orange opening quote mark, client name/title in grey caps, orange 3px accent line bottom-left.',
    captions: {
      linkedin: `"Working with Cresio felt like having a CMO and a design team in one." — Founder, Series A SaaS

We think about it the same way. Good design isn't a coat of paint at the end — it's a growth function. Positioning, message, and interface all pulling in one direction.

When your brand starts doing the selling for you, the system is working.

Proud of what we built together.

More client results on our site — link in comments.

#CresioLabs #ClientLove #BrandStrategy`,
    },
  },
  {
    date: '2026-06-25', week: 'week-3', title: 'Stop Using Dark Mode for Everything — Here\'s Why Light Works Harder',
    type: 'educational', category: 'Educational', pillar: 'Thought Leadership',
    format: 'single post', platforms: ['linkedin'], priority: 'MEDIUM', publish: W_LI,
    image: 'Split card — dark left / light right; annotation overlays on CTA contrast differences; comparison click-rate stats.',
    captions: {
      linkedin: `Dark mode looks premium. It rarely sells better.

Dark interfaces signal "sleek." Light interfaces signal "clear." And in most B2B sales cycles — where a buyer is forwarding your page to a skeptical colleague — clarity wins.

Dark UI hides two things you can't afford to hide:
→ Your CTA contrast
→ Your information hierarchy

Use dark mode as an option, not a personality. Default to the version your least-technical buyer can scan in five seconds.

Agree or disagree? Reply with your take.

#CresioLabs #UIDesign #B2BDesign`,
    },
  },
  {
    date: '2026-06-26', week: 'week-3', title: '3 Figma Shortcuts That Save Our Team 2 Hours a Week',
    type: 'tips-and-tricks', category: 'Tips & Tricks', pillar: 'Product Value',
    format: 'carousel 5 slides', platforms: ['instagram'], priority: 'MEDIUM', publish: W_IG,
    image: 'Dark cover (#121212) with faded "Figma" wordmark; real Figma UI screenshots per shortcut, tight crops, orange highlights.',
    slides: [
      'Cover: 3 Figma Shortcuts We Can\'t Work Without',
      'Cmd/Ctrl + R — rename layers in bulk',
      'Cmd+G vs Cmd+Alt+G — Frame vs Group',
      'Ctrl+P / Cmd+/ — the hidden command bar',
      'CTA: Save this + follow for more Figma drops',
    ],
    captions: {
      instagram: `3 Figma shortcuts that save our team 2 hours a week ⚡️

Not the basics. The ones we found by accident and now refuse to work without:

⌨️ Cmd/Ctrl + R → rename layers in bulk with sequential numbering
⌨️ Cmd+Alt+G → Frame instead of Group (constraints + auto-layout — night and day)
⌨️ Cmd+/ → command palette, run any action without touching a menu

Small shortcuts. Compounding time.

Save this 🔖 and follow for more Figma drops.
·
·
#CresioLabs #FigmaTips #DesignTools #Figma #UXDesign #ProductDesign #DesignWorkflow #UIDesign`,
    },
  },
  {
    date: '2026-06-29', week: 'week-3', title: 'A Rebrand Story: Generic SaaS to Category-Defining Brand in 6 Weeks',
    type: 'case-study', category: 'Case Study', pillar: 'Social Proof',
    format: 'single post', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'HIGH', publish: W_ALL,
    image: 'Before/after brand identity — logo + homepage hero comparison. "After" = sharp black, orange accents, bold typography.',
    captions: {
      linkedin: `The brief was one sentence: "We need to look like we belong in enterprise deals."

The product was strong. The brand made them look like a side project. Buyers noticed before they ever booked a call.

In 6 weeks we rebuilt the system end to end — identity, messaging, site, sales deck. Sharp black, decisive type, one confident accent. Everything saying the same thing: this is a serious company.

Result: 3 new enterprise pilots in the first month post-launch.

Perception isn't fluff. In enterprise, it's the first qualifier.

See the full transformation — link in comments.

#CresioLabs #Rebrand #BrandIdentity`,
      instagram: `Generic SaaS → category-defining brand. In 6 weeks. 🔥

The brief was one sentence:
"We need to look like we belong in enterprise deals."

The product was strong. The brand made them look like a side project.

We rebuilt everything — identity, messaging, site, deck. Sharp black. Decisive type. One confident accent.

Result: 3 enterprise pilots in month one.

Perception is the first qualifier 👇 full story in bio.
·
·
#CresioLabs #Rebrand #BrandIdentity #BrandDesign #SaaS #BeforeAndAfter #GraphicDesign #StartupBranding`,
      twitter: `Brief: "We need to look like we belong in enterprise deals."

Strong product. Brand looked like a side project.

6 weeks: rebuilt identity, messaging, site, deck.

Result: 3 enterprise pilots in month one.

Perception is the first qualifier.
#CresioLabs #Rebrand`,
    },
  },
  {
    date: '2026-06-30', week: 'week-4', title: 'The Best Brands We\'ve Worked With All Had One Thing in Common',
    type: 'thought-leadership', category: 'Thought Leadership', pillar: 'Thought Leadership',
    format: 'single post', platforms: ['linkedin'], priority: 'MEDIUM', publish: W_LI,
    image: 'Single editorial card — bold 2-line statement, orange accent line, no imagery, heavy typographic treatment.',
    captions: {
      linkedin: `The best brands we've worked with all shared one thing. It wasn't budget. It wasn't a famous founder.

It was a clear point of view — on their market, their customer, and the role they play in the story.

A point of view makes every decision easier. What to say. What to cut. What to never do. Brands without one end up sounding like everyone else — because "everyone else" is the safest place to hide.

You can't design your way out of not having a position. But once you have one, design makes it impossible to ignore.

What's your brand's point of view?

#CresioLabs #BrandStrategy #Positioning`,
    },
  },
  {
    date: '2026-07-02', week: 'week-4', title: 'We\'re Redesigning Our Own Website — Here\'s the Moodboard',
    type: 'behind-the-scenes', category: 'Behind the Scenes', pillar: 'Brand Culture',
    format: 'carousel 6 slides', platforms: ['instagram'], priority: 'MEDIUM', publish: W_IG,
    image: 'Split cover dark/white + "MOODBOARD REVEAL" badge; 3-panel direction grids; current-vs-new hero; "47%" stat slide.',
    slides: [
      'Cover: We\'re Redesigning Our Website. Here\'s the Moodboard.',
      'Direction 1: Editorial Black & White',
      'Direction 2: Structured Grid with Motion Hints',
      'Current Site vs New Direction (hero comparison)',
      'Stat: 47% of visitors decide to stay in under 3 seconds',
      'CTA: Which direction would you choose? Vote in comments',
    ],
    captions: {
      instagram: `We're redesigning our own website. Here's the moodboard. 🎨

Every few months we eat our own cooking — sharing the process because transparency is how we work.

Two directions on the table:
🅰️ Editorial black & white — heavy type, one orange pop
🅱️ Structured grid + motion — tighter, more dynamic, same rigor

The stat keeping us honest: 47% of visitors decide whether to stay in under 3 seconds. So the fold has to earn it.

Which direction would you ship? Vote in the comments 👇
·
·
#CresioLabs #WebDesign #Moodboard #DesignProcess #UIDesign #BrandDesign #BehindTheScenes #CreativeProcess`,
    },
  },
  {
    date: '2026-07-03', week: 'week-4', title: 'Why Your CTA Button Colour Matters More Than You Think',
    type: 'educational', category: 'Educational', pillar: 'Thought Leadership',
    format: 'carousel 7 slides', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'HIGH', publish: W_ALL,
    image: 'Text-only tension cover + "11 A/B TESTS" badge; mini 4-colour button bar chart; heatmap illustration; ranked-list slide.',
    slides: [
      'Cover: Your CTA Button Colour Is Losing You Conversions',
      'Stat: 34% higher CTR — orange vs default blue',
      'Why Orange Works: Pattern Interruption (heatmap)',
      'Copy is 2× more important than colour',
      'Size & Placement tie for third (44px min, after value prop)',
      'Full CTA Hierarchy: Colour → Size → Copy → Placement',
      'CTA: Book a free design audit — comment "AUDIT"',
    ],
    captions: {
      linkedin: `We ran 11 A/B tests on CTA buttons last year. The results weren't what we expected.

What we found, in order of impact:

1. Colour — orange beat blue, green and grey in 8 of 11 tests (up to +34% CTR). Pattern interruption: most pages use blue for everything, so the eye goes to the odd one out.
2. Copy — "Get Started Free" beat "Sign Up" by 28% at the same colour. For returning visitors, copy mattered most of all.
3. Size — must be tappable without zooming (44px min on mobile).
4. Placement — immediately after the value prop, not at the bottom.

Most teams argue about colour and ignore the copy. Test both.

Book a free design audit — we'll review your CTA setup. Link in comments.

#CresioLabs #ConversionOptimisation #ABTesting`,
      instagram: `Your CTA button colour is losing you conversions 🟠

We ran 11 A/B tests last year. The results surprised us.

What actually moved the needle, in order:

1️⃣ Colour — orange beat blue/green/grey (up to +34% CTR)
2️⃣ Copy — "Get Started Free" beat "Sign Up" +28% (same colour!)
3️⃣ Size — min 44px on mobile
4️⃣ Placement — right after the value prop

Most teams argue colour and ignore copy. Test both.

Save this 🔖 DM "AUDIT" for a free CTA review.
·
·
#CresioLabs #ConversionOptimisation #ABTesting #CRO #UXDesign #WebDesign #ProductDesign #LandingPage`,
      twitter: `We ran 11 A/B tests on CTA buttons. What moved conversions, in order:

1. Colour — orange beat blue/green/grey (+34% CTR)
2. Copy — "Get Started Free" > "Sign Up" (+28%)
3. Size — 44px min on mobile
4. Placement — after the value prop

Test colour AND copy. 🧵
#CresioLabs #CRO`,
    },
  },
  {
    date: '2026-07-06', week: 'week-4', title: 'What\'s One Design Resource You Recommend to Every Designer?',
    type: 'engagement', category: 'Engagement', pillar: 'Brand Culture',
    format: 'carousel 4 slides', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'MEDIUM', publish: W_ALL,
    image: 'Oversized orange question mark cover (120pt); illustrated book covers in brand colours (not real covers); "WHY WE LOVE IT" panels.',
    slides: [
      'Cover: One Design Resource Every Designer Should Know',
      'Pick 1: Refactoring UI — Adam Wathan & Steve Schoger',
      'Pick 2: Laws of UX — Jon Yablonski',
      'CTA: Drop yours in the comments',
    ],
    captions: {
      linkedin: `We ask this in every team interview: what's one design resource you'd recommend to every designer? The answers are always revealing.

Two we recommend constantly:

→ Refactoring UI (Adam Wathan & Steve Schoger) — the most practical UI book we've found. Not theory. Actual before/after techniques you can apply today.

→ Laws of UX (Jon Yablonski) — short, dense, and it explains *why* good design works: Hick's Law, Fitts's Law, Von Restorff, all with real examples.

We're curating a public list from the best answers.

What's the one resource you'd recommend to every designer? 👇

#CresioLabs #DesignResources #Designers`,
      instagram: `One design resource every designer should know 📚

We ask this in every interview. The answers are always revealing.

Our two picks:

📕 Refactoring UI — Wathan & Schoger. Practical UI techniques, real before/afters. Not theory.

📗 Laws of UX — Jon Yablonski. The psychology behind good design: Hick's, Fitts's, Von Restorff.

We're curating a public list from your answers.

Drop yours in the comments 👇
·
·
#CresioLabs #DesignResources #Designers #UXDesign #UIDesign #DesignBooks #ProductDesign #DesignCommunity`,
      twitter: `We ask this in every interview: one design resource you'd recommend to every designer?

Our picks:
📕 Refactoring UI — Wathan & Schoger
📗 Laws of UX — Jon Yablonski

Curating a public list. Drop yours 👇
#CresioLabs #DesignResources`,
    },
  },
  {
    date: '2026-07-07', week: 'week-4', title: 'That\'s a Wrap on June — Here\'s What We Published and What Performed',
    type: 'announcement', category: 'Announcement', pillar: 'Brand Culture',
    format: 'single post', platforms: ['linkedin', 'instagram', 'twitter'], priority: 'MEDIUM', publish: W_ALL,
    note: 'Fill in real metrics from the board\'s performance trackers before posting.',
    image: 'Stats grid card — 4 metric boxes (Reach, Impressions, Engagements, Top Post), white BG, black bold numbers, orange labels.',
    captions: {
      linkedin: `Transparency time. At the end of every month we publish our own content metrics — the wins and the misses.

What we learned this month:
→ Carousels drove the most saves by a wide margin. Educational beats promotional, every time.
→ Our highest-reach post was a question, not a statement. Debate beats broadcast.
→ Case studies drove the actual inbound. Proof closes.

What we're doubling down on in July: more scripted carousels, more strong opinions, more client results.

We share this because we ask clients to be data-led — so we are too.

Follow for monthly wrap-ups →

#CresioLabs #ContentStrategy #CreatorInsights`,
      instagram: `That's a wrap on June 📊

Every month we share our own content metrics — what landed, what didn't.

What we learned:
🔖 Carousels won saves by a mile. Educational > promotional.
💬 Our highest-reach post was a question, not a statement.
📈 Case studies drove the real inbound.

Doubling down in July: more carousels, stronger opinions, more client wins.

We ask clients to be data-led — so we are too.

Follow for monthly wrap-ups 👇
·
·
#CresioLabs #ContentStrategy #CreatorInsights #SocialMediaMarketing #DesignStudio #ContentMarketing`,
      twitter: `That's a wrap on June 📊

What we learned:
- Carousels won saves by a mile
- Our highest-reach post was a question, not a statement
- Case studies drove the real inbound

July: more carousels, stronger opinions, more proof.
#CresioLabs #ContentStrategy`,
    },
  },
];

// ── Description builder ─────────────────────────────────────────────────────
function buildDescription(p) {
  const out = [];
  out.push(`**Type:** ${p.category} · **Format:** ${p.format} · **Pillar:** ${p.pillar}`);
  out.push(`**Publish window:** ${p.publish}`);
  if (p.note) out.push(`\n> ⚠️ ${p.note}`);
  out.push('');
  if (p.captions.linkedin) { out.push('### 🔗 LinkedIn'); out.push(p.captions.linkedin); out.push(''); }
  if (p.captions.instagram) { out.push('### 📸 Instagram'); out.push(p.captions.instagram); out.push(''); }
  if (p.captions.twitter) { out.push('### 𝕏 Twitter/X'); out.push(p.captions.twitter); out.push(''); }
  out.push('---');
  out.push(`🎨 **Image direction:** ${p.image}`);
  if (p.slides && p.slides.length) {
    out.push('');
    out.push('🎠 **Carousel slides:**');
    p.slides.forEach((s, i) => out.push(`${i + 1}. ${s}`));
  }
  return out.join('\n');
}

// ── Run ─────────────────────────────────────────────────────────────────────
async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set (.env.local)');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', new mongoose.Schema({}, { strict: false, collection: 'workspaces' }));
  const Board = mongoose.models.Board || mongoose.model('Board', new mongoose.Schema({}, { strict: false, collection: 'boards' }));
  // `timestamps: true` is REQUIRED — the app's Task mappers call
  // `task.createdAt.toISOString()`, so inserting docs without createdAt crashes
  // the board's Server Component render. The real Task model enables timestamps;
  // this loose mirror must match it.
  const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks', timestamps: true }));

  const ws = await Workspace.findOne({ slug: 'cresiolabs' });
  if (!ws) throw new Error('CresioLabs workspace (slug:cresiolabs) not found');
  const board = await Board.findOne({ workspaceId: ws._id, slug: 'social-media' });
  if (!board) throw new Error('Social Media board (slug:social-media) not found');
  console.log(`Workspace: ${ws.name} (${ws._id})`);
  console.log(`Board:     ${board.name} (${board._id})\n`);

  // 1) Upsert categories onto the board. Generate explicit _ids so we can assign
  //    them to tasks deterministically (a loose/strict:false schema won't auto-id
  //    subdocuments). Preserve existing category _ids by name where present.
  const existing = new Map((board.categories || []).map((c) => [c.name, c]));
  const categories = Object.entries(CATEGORY_COLORS).map(([name, color]) => {
    const prev = existing.get(name);
    return { _id: prev ? prev._id : new mongoose.Types.ObjectId(), name, color };
  });
  await Board.updateOne({ _id: board._id }, { $set: { categories } });
  const catId = new Map(categories.map((c) => [c.name, c._id]));
  console.log(`Categories upserted: ${categories.length}`);

  // 2) Wipe existing content-calendar tasks on this board.
  const del = await Task.deleteMany({ boardId: board._id, tags: 'content-calendar' });
  console.log(`Deleted old calendar tasks: ${del.deletedCount}`);

  // 3) Insert the 16 enriched tasks.
  const docs = POSTS.map((p, i) => {
    const when = new Date(p.date + 'T09:00:00.000Z');
    return {
      workspaceId: ws._id,
      boardId: board._id,
      title: p.title,
      description: buildDescription(p),
      status: 'TODO',
      priority: p.priority,
      categoryId: catId.get(p.category),
      scheduledDate: when,
      dueDate: when,
      tags: ['content-calendar', p.week, ...p.platforms, p.format.split(' ')[0], p.type],
      order: i,
      assignees: [],
      subtasks: [],
      comments: [],
      links: [],
    };
  });
  const res = await Task.insertMany(docs);
  console.log(`Created ${res.length} tasks:\n`);

  for (const p of POSTS) {
    const d = new Date(p.date + 'T09:00:00.000Z');
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    const plats = p.platforms.map((x) => x[0].toUpperCase()).join('+');
    console.log(`  ${day.padEnd(13)} ${plats.padEnd(6)} ${p.format.padEnd(18)} ${p.title.slice(0, 46)}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
