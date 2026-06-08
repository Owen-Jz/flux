const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'flux' });

  const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({
    workspaceId: mongoose.Schema.Types.ObjectId,
    boardId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    status: String,
    priority: String,
    dueDate: Date,
    tags: [String],
    order: Number,
  }, { timestamps: true }));

  const boardId = new mongoose.Types.ObjectId('6a1967bc4a8f2579a2fe721a');
  const workspaceId = new mongoose.Types.ObjectId('69b14114090729d8ee11d3b4');

  const posts = [
    // WEEK 1 — Authority & Education
    {
      date: '2026-06-02', week: 'week-1', title: 'Why Most SaaS Brands Get Visual Identity Wrong',
      type: 'thought-leadership', platform: 'linkedin', format: 'single-post', priority: 'MEDIUM',
      desc: 'Hook: Most SaaS brands are copying each other — same blues, same stock photos, same forgettable layouts. Standing out is about being clear.\nCTA: Comment your biggest brand identity mistake.\nVisual: Clean white BG, bold black headline, orange accent underline.\nHashtags: #CresioLabs #BrandDesign #SaaS',
    },
    {
      date: '2026-06-04', week: 'week-1', title: '5 Rules We Follow for Every Landing Page We Build',
      type: 'tips-and-tricks', platform: 'both', format: 'carousel-7-slides', priority: 'HIGH',
      desc: 'Hook: Before we write a single line of code, we answer five non-negotiable questions.\nCTA: Save this for your next redesign sprint.\nSlides: Cover → Rule 1: One Job Per Page → Rule 2: Headline in 7 Words or Less → Rule 3: CTA Above the Fold → Rule 4: Strip Every Form Field → Rule 5: Social Proof Near the CTA → Orange CTA slide.\nHashtags: #CresioLabs #LandingPage #ConversionDesign',
    },
    {
      date: '2026-06-06', week: 'week-1', title: 'How We Increased a Client Trial Signups by 47% in 90 Days',
      type: 'case-study', platform: 'linkedin', format: 'single-post', priority: 'HIGH',
      desc: 'Hook: They had traffic. The problem was friction. We stripped 3 form fields, rewrote the headline, moved the CTA above the fold.\nVisual: Before/after split layout. Stat "47%" in large bold orange.\nCTA: Read the full case study — link in bio.\nHashtags: #CresioLabs #CRO #GrowthDesign',
    },
    // WEEK 2 — Launch & Culture
    {
      date: '2026-06-09', week: 'week-2', title: 'We Just Shipped a New Design Sprint Framework for Early-Stage Startups',
      type: 'announcement', platform: 'both', format: 'single-post', priority: 'HIGH',
      desc: 'Hook: After 18 months of refining it with real clients, our 5-day framework is now a standalone engagement.\nCTA: DM us SPRINT to get early access details.\nVisual: White BG, bold NEW → in orange top-left, launch date bottom-right.\nHashtags: #CresioLabs #DesignSprint #Startups',
    },
    {
      date: '2026-06-10', week: 'week-2', title: 'A Day in Our Design Process — From Brief to First Wireframe',
      type: 'behind-the-scenes', platform: 'instagram', format: 'carousel-5-slides', priority: 'MEDIUM',
      desc: 'Hook: We do not open Figma first. We open a doc.\nSlides: Cover (overhead flat-lay photo) → Hour 1: Brief Document → Hour 2: Whiteboard Sketching → Hour 3-4: Lo-Fi Wireframe in Figma → CTA: Follow for process transparency.\nHashtags: #CresioLabs #DesignProcess #BehindTheScenes',
    },
    {
      date: '2026-06-12', week: 'week-2', title: 'The Hierarchy Mistake That Kills Most Product Pages',
      type: 'educational', platform: 'linkedin', format: 'carousel-6-slides', priority: 'HIGH',
      desc: 'Hook: If your page headline, subhead, and body text are all the same visual weight, your visitor\'s eye has nowhere to go.\nSlides: Cover → Before: No Hierarchy → Stat: 3x more likely to read page with clear hierarchy → After: Clear Hierarchy → 3-Level Rule: H1 · H2 · Body → CTA: Audit your page hierarchy.\nHashtags: #CresioLabs #WebDesign #UXDesign',
    },
    {
      date: '2026-06-14', week: 'week-2', title: 'Which Design Trend Do You Think Will Die in 2025?',
      type: 'engagement', platform: 'both', format: 'single-post', priority: 'MEDIUM',
      desc: 'Hook: We have a strong opinion. But we want to hear yours first.\nVisual: Bold question typography on white, oversized orange question mark (120pt).\nCTA: Comment below — let\'s debate.\nHashtags: #CresioLabs #DesignTrends #Design2025',
    },
    // WEEK 3 — Proof & Debate
    {
      date: '2026-06-16', week: 'week-3', title: 'Testimonial: Working with Cresio Felt Like Having a CMO + Design Team in One',
      type: 'testimonial', platform: 'linkedin', format: 'single-post', priority: 'HIGH',
      desc: '⚠️ REPLACE WITH REAL CLIENT TESTIMONIAL before posting — use one from Comraidshops or NDH.\nHook: When your brand starts doing the selling for you, you know the system is working.\nVisual: White quote card, large opening quote mark in light orange, orange 3px accent line bottom-left.\nCTA: Read more results on our website.\nHashtags: #CresioLabs #ClientLove #BrandStrategy',
    },
    {
      date: '2026-06-18', week: 'week-3', title: 'Stop Using Dark Mode for Everything — Here\'s Why Light Works Harder',
      type: 'educational', platform: 'linkedin', format: 'single-post', priority: 'MEDIUM',
      desc: 'Hook: Dark interfaces signal premium. Light interfaces signal clarity. For most B2B products, clarity wins — especially in enterprise sales cycles.\nVisual: Split card — dark left / light right, annotation overlays showing CTA contrast differences.\nCTA: Agree or disagree? Reply with your take.\nHashtags: #CresioLabs #UIDesign #B2BDesign',
    },
    {
      date: '2026-06-19', week: 'week-3', title: '3 Figma Shortcuts That Save Our Team 2 Hours a Week',
      type: 'tips-and-tricks', platform: 'instagram', format: 'carousel-5-slides', priority: 'MEDIUM',
      desc: 'Hook: These are not the basics. These are the ones we found by accident and now refuse to work without.\nSlides: Cover (dark, Figma wordmark faded) → Cmd+R: Rename Layers in Bulk → Cmd+G vs Cmd+Alt+G: Frame vs Group → Ctrl+P: Quick Actions Command Bar → CTA: Save + Follow for more Figma drops.\nHashtags: #CresioLabs #FigmaTips #DesignTools',
    },
    {
      date: '2026-06-20', week: 'week-3', title: 'A Rebrand Story: Generic SaaS to Category-Defining Brand in 6 Weeks',
      type: 'case-study', platform: 'both', format: 'single-post', priority: 'HIGH',
      desc: 'Hook: The brief was simple — "We need to look like we belong in enterprise deals." Result: 3 new enterprise pilots in the first month post-rebrand.\nVisual: Before/after brand identity comparison. Cresio system shown in after — sharp black, orange accents, bold typography.\nCTA: See the full transformation — link in bio.\nHashtags: #CresioLabs #Rebrand #BrandIdentity',
    },
    // WEEK 4 — Closing Strong
    {
      date: '2026-06-23', week: 'week-4', title: 'The Best Brands We\'ve Worked With All Had One Thing in Common',
      type: 'thought-leadership', platform: 'linkedin', format: 'single-post', priority: 'MEDIUM',
      desc: 'Hook: It was not budget. It was not a famous founder. It was a clear point of view — on their market, their customer, and their role in the story.\nVisual: Single editorial card, bold statement in 2 lines, orange accent line. No imagery — let copy lead.\nCTA: What is your brand\'s point of view?\nHashtags: #CresioLabs #BrandStrategy #Positioning',
    },
    {
      date: '2026-06-25', week: 'week-4', title: 'We\'re Redesigning Our Own Website — Here\'s the Moodboard',
      type: 'behind-the-scenes', platform: 'instagram', format: 'carousel-6-slides', priority: 'MEDIUM',
      desc: 'Hook: Every few months we eat our own cooking. New website incoming.\nSlides: Cover (split dark/white) → Direction 1: Editorial Black & White → Direction 2: Structured Grid with Motion → Current vs New hero comparison → Stat: 47% of visitors decide to stay in under 3 seconds → CTA: Which direction would you choose? (vote in comments).\nHashtags: #CresioLabs #WebDesign #Moodboard',
    },
    {
      date: '2026-06-26', week: 'week-4', title: 'Why Your CTA Button Colour Matters More Than You Think',
      type: 'educational', platform: 'both', format: 'carousel-7-slides', priority: 'HIGH',
      desc: 'Hook: We ran 11 A/B tests on CTA buttons last year. The results were not what we expected.\nSlides: Cover → Stat: 34% higher CTR orange vs blue → Why Orange Works: Pattern Interruption → Copy is 2x more important than colour → Size and Placement → Full CTA Hierarchy: Colour > Size > Copy > Placement → CTA: Book free design audit, comment AUDIT.\nHashtags: #CresioLabs #ConversionOptimisation #ABTesting',
    },
    {
      date: '2026-06-27', week: 'week-4', title: 'What\'s One Design Resource You Recommend to Every Designer?',
      type: 'engagement', platform: 'both', format: 'carousel-4-slides', priority: 'MEDIUM',
      desc: 'Hook: We ask this in every team interview. The answers are always revealing.\nSlides: Cover (oversized orange question mark) → Pick 1: Refactoring UI by Adam Wathan & Steve Schoger → Pick 2: Laws of UX by Jon Yablonski → CTA: Comment yours — we are curating a public list.\nHashtags: #CresioLabs #DesignResources #Designers',
    },
    {
      date: '2026-06-30', week: 'week-4', title: 'June Wrap-Up: Here\'s What We Published and What Performed',
      type: 'announcement', platform: 'both', format: 'single-post', priority: 'MEDIUM',
      desc: 'Hook: Transparency time. Every end of month we share our own content metrics. Here is what landed, what did not, and what we are doubling down on in July.\nVisual: Stats grid card — 4 metric boxes (Reach, Impressions, Engagements, Top Post), white BG, black bold numbers, orange labels.\nCTA: Follow for monthly wrap-ups.\nHashtags: #CresioLabs #ContentStrategy #CreatorInsights',
    },
  ];

  // Clear previously seeded calendar tasks
  const deleted = await Task.deleteMany({ boardId, tags: 'content-calendar' });
  console.log('Cleared old calendar tasks:', deleted.deletedCount);

  const docs = posts.map((p, i) => ({
    workspaceId,
    boardId,
    title: p.title,
    description: p.desc,
    status: 'TODO',
    priority: p.priority,
    dueDate: new Date(p.date + 'T09:00:00.000Z'),
    tags: ['content-calendar', p.week, p.platform, p.format, p.type],
    order: i,
  }));

  const result = await Task.insertMany(docs);
  console.log('Created', result.length, 'tasks:\n');

  for (const p of posts) {
    const d = new Date(p.date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    const fmt = p.format.replace(/-/g, ' ');
    console.log(day.padEnd(14) + p.platform.padEnd(12) + fmt.padEnd(22) + p.title.slice(0, 50));
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
