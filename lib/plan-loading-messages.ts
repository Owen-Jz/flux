// Domain-aware, engaging loading phrases shown while the AI builds a plan.
//
// The goal is to keep users watching while they wait (the way assistants show
// "thinking…/working…") — but reflect THEIR domain, not just tech. A finance
// plan shows "Organizing the portfolio", a wedding shows "Lining up vendors",
// etc. Pure keyword inference on the client, so it adds zero latency.

interface PlanDomain {
    /** Lowercased substrings that, if present in the description, select this domain. */
    keywords: string[];
    /** Rotating phrases shown while planning (a closing "Finalizing…" is appended). */
    messages: string[];
}

// Ordered most-specific → most-general; the first domain with a keyword hit wins.
const DOMAINS: PlanDomain[] = [
    {
        keywords: ['financ', 'invest', 'portfolio', 'budget', 'taxes', 'tax ', 'stock', 'trading', 'wealth', 'mortgage', 'savings', 'revenue', 'expense', 'accounting', 'fundraising'],
        messages: ['Reviewing the financials', 'Organizing the portfolio', 'Mapping the strategy', 'Setting milestones', 'Writing tasks'],
    },
    {
        keywords: ['wedding', 'event', 'party', 'conference', 'venue', 'catering', 'guest list', 'ceremony', 'reception', 'gala', 'festival', 'birthday'],
        messages: ['Sketching the run-of-show', 'Lining up vendors', 'Building the guest plan', 'Scheduling milestones', 'Writing tasks'],
    },
    {
        keywords: ['marketing', 'campaign', 'brand', 'seo', 'social media', 'advertis', 'audience', 'growth', 'funnel', 'content calendar', 'go-to-market', 'launch plan'],
        messages: ['Studying the audience', 'Shaping the campaign', 'Planning the channels', 'Mapping the timeline', 'Writing tasks'],
    },
    {
        keywords: ['website', 'web app', 'webapp', 'software', 'saas', 'mobile app', 'platform', 'frontend', 'backend', 'database', 'codebase', 'application', 'api integration', 'dashboard'],
        messages: ['Scoping the build', 'Breaking down features', 'Sequencing the work', 'Estimating effort', 'Writing tasks'],
    },
    {
        keywords: ['book', 'novel', 'blog', 'article', 'newsletter', 'screenplay', 'script', 'manuscript', 'chapter', 'copywriting', 'content series'],
        messages: ['Outlining the structure', 'Shaping the narrative', 'Planning the sections', 'Setting deadlines', 'Writing tasks'],
    },
    {
        keywords: ['research', 'thesis', 'dissertation', 'experiment', 'survey', 'study ', 'literature review', 'hypothesis', 'academic paper'],
        messages: ['Framing the questions', 'Designing the approach', 'Planning the phases', 'Setting milestones', 'Writing tasks'],
    },
    {
        keywords: ['course', 'curriculum', 'lesson', 'syllabus', 'teaching', 'training program', 'workshop', 'class ', 'module'],
        messages: ['Mapping the curriculum', 'Sequencing the modules', 'Planning the lessons', 'Setting milestones', 'Writing tasks'],
    },
    {
        keywords: ['construct', 'renovat', 'remodel', 'kitchen', 'bathroom', 'contractor', 'real estate', 'landscap', 'building a house', 'home improvement'],
        messages: ['Reviewing the scope', 'Planning the phases', 'Lining up the trades', 'Scheduling milestones', 'Writing tasks'],
    },
    {
        keywords: ['fitness', 'workout', 'diet', 'nutrition', 'wellness', 'training plan', 'meal plan', 'exercise', 'marathon'],
        messages: ['Assessing the goals', 'Designing the plan', 'Setting the schedule', 'Planning milestones', 'Writing tasks'],
    },
    {
        keywords: ['sales', 'business plan', 'startup', 'ecommerce', 'online store', 'product line', 'client', 'customer', 'operations', 'hiring', 'onboarding'],
        messages: ['Analyzing the goals', 'Shaping the plan', 'Prioritizing the work', 'Mapping milestones', 'Writing tasks'],
    },
];

const GENERAL: string[] = [
    'Analyzing your project',
    'Identifying the work',
    'Organizing the plan',
    'Estimating effort',
    'Writing tasks',
];

const CLOSING = 'Finalizing your plan';

/**
 * Returns an ordered list of engaging, domain-tailored loading phrases for a
 * given project description. Always ends with a closing "Finalizing" message.
 * Falls back to general phrases when no domain is recognised.
 */
export function getPlanLoadingMessages(description: string): string[] {
    const text = (description || '').toLowerCase();
    const domain = DOMAINS.find((d) => d.keywords.some((k) => text.includes(k)));
    return [...(domain ? domain.messages : GENERAL), CLOSING];
}
