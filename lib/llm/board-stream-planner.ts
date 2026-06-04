// lib/llm/board-stream-planner.ts
import type {
  BoardSection,
  BoardSkeletonResponse,
  LLMSectionTask,
  SectionTasksResponse,
} from './types';
import type { StreamTaskStatus } from '@/types/ai-plan';
import { sanitizeContextLinks } from './sanitize';

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const SKELETON_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, break it into a small set of high-level sections (workstreams or phases). Do NOT generate tasks yet.

Output valid JSON only — no markdown, no explanation:
{
  "title": "short project title (≤60 chars)",
  "summary": "one-sentence overview",
  "sections": [
    { "name": "Section name (≤40 chars)", "description": "what this section covers (≤120 chars)" }
  ]
}

Rules:
- 3-5 sections, ordered logically (earliest work first)
- Sections are phases or workstreams (e.g., "Setup", "Core Build", "Polish", "Launch")
- Section names are short noun phrases
- Respond ONLY with valid JSON`;

export const SECTION_SYSTEM_PROMPT = `You are a project planning assistant. Given a project and ONE section of it, generate the concrete tasks for that section only.

Output valid JSON only — no markdown, no explanation:
{
  "tasks": [
    {
      "title": "task title (≤80 chars)",
      "description": "what to do and how (≤300 chars)",
      "priority": "High|Medium|Low",
      "status": "Backlog|Todo|In Progress",
      "estimatedHours": <number>
    }
  ]
}

Rules:
- Only tasks belonging to THIS section
- Titles are imperative: "Build the homepage", not "Homepage"
- estimatedHours is a realistic integer 1-24
- status: this is a brand-new plan. Put the 1-2 most immediate, dependency-free tasks in "Todo" and the rest in "Backlog". Use "In Progress" ONLY if the description says work is already underway. NEVER use any other status.
- Respond ONLY with valid JSON`;

// ---------------------------------------------------------------------------
// User-prompt builders
// ---------------------------------------------------------------------------

export interface SkeletonPromptInput {
  description: string;
  deadline?: string;
  contextLinks?: string[];
  maxTasks?: number;
}

export function buildSkeletonUserPrompt(input: SkeletonPromptInput): string {
  let prompt = `Project description:\n${input.description}\n\n`;
  if (input.deadline) prompt += `Target completion date: ${input.deadline}\n\n`;
  const safe = sanitizeContextLinks(input.contextLinks);
  if (safe.length > 0) prompt += `Reference links:\n${safe.map(l => `- ${l}`).join('\n')}\n\n`;
  if (input.maxTasks) prompt += `The whole project should total about ${input.maxTasks} tasks across all sections.\n\n`;
  prompt += `Break this project into 3-5 high-level sections.`;
  return prompt;
}

export interface SectionPromptInput {
  description: string;
  section: BoardSection;
  allSections: BoardSection[];
  maxTasksForSection: number;
  deadline?: string;
}

export function buildSectionUserPrompt(input: SectionPromptInput): string {
  let prompt = `Project description:\n${input.description}\n\n`;
  prompt += `The project is divided into these sections:\n${input.allSections
    .map((s, i) => `${i + 1}. ${s.name} — ${s.description}`)
    .join('\n')}\n\n`;
  if (input.deadline) prompt += `Target completion date: ${input.deadline}\n\n`;
  prompt += `Generate up to ${input.maxTasksForSection} tasks for ONLY this section:\n`;
  prompt += `"${input.section.name}" — ${input.section.description}`;
  return prompt;
}

// ---------------------------------------------------------------------------
// JSON extraction + parsing (pure)
// ---------------------------------------------------------------------------

/** Strip markdown code fences and return the raw JSON string */
export function extractJsonString(content: string): string {
  let jsonStr = content.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return jsonStr;
}

export function parseSkeletonResponse(content: string): BoardSkeletonResponse {
  if (!content) throw new Error('No content in LLM response');
  let parsed: BoardSkeletonResponse;
  try {
    parsed = JSON.parse(extractJsonString(content)) as BoardSkeletonResponse;
  } catch {
    throw new Error('Failed to parse skeleton response as JSON');
  }
  if (!parsed.title) throw new Error('Skeleton missing required field: title');
  if (!parsed.summary) throw new Error('Skeleton missing required field: summary');
  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error('Skeleton missing sections array');
  }
  for (const s of parsed.sections) {
    if (!s.name || !s.description) throw new Error('Section missing required fields');
  }
  return parsed;
}

export function parseSectionResponse(content: string): SectionTasksResponse {
  if (!content) throw new Error('No content in LLM response');
  let parsed: SectionTasksResponse;
  try {
    parsed = JSON.parse(extractJsonString(content)) as SectionTasksResponse;
  } catch {
    throw new Error('Failed to parse section response as JSON');
  }
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error('Section response missing tasks array');
  }
  for (const t of parsed.tasks) {
    if (!t.title || !t.description || typeof t.estimatedHours !== 'number') {
      throw new Error('Section task missing required fields');
    }
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Normalizers (pure) — title-case LLM enums → app uppercase, with safe fallback
// ---------------------------------------------------------------------------

export function normalizePriority(p: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
    Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH',
    low: 'LOW', medium: 'MEDIUM', high: 'HIGH',
    LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH',
  };
  return map[p] ?? 'MEDIUM';
}

/**
 * Clamp an LLM-provided hour estimate to the 1-24 contract. The model is
 * asked for a realistic integer 1-24, but can return NaN, Infinity, 0,
 * negatives, or absurd values — coerce all of those to a safe default/range
 * rather than persisting garbage.
 */
export function normalizeEstimatedHours(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 2; // sensible default when the model gives us nothing usable
  }
  return Math.min(Math.round(value), 24);
}

/** Clamp any model status to one of the three allowed starting columns. */
export function normalizeStatus(s: string): StreamTaskStatus {
  const key = (s ?? '').toString().trim().toLowerCase();
  const map: Record<string, StreamTaskStatus> = {
    'backlog': 'BACKLOG',
    'todo': 'TODO',
    'to do': 'TODO',
    'in progress': 'IN_PROGRESS',
    'in_progress': 'IN_PROGRESS',
    'inprogress': 'IN_PROGRESS',
  };
  return map[key] ?? 'BACKLOG';
}

export function normalizeSectionTask(t: LLMSectionTask): {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: StreamTaskStatus;
  estimatedHours: number;
} {
  return {
    title: t.title,
    description: t.description,
    priority: normalizePriority(t.priority),
    status: normalizeStatus(t.status),
    estimatedHours: normalizeEstimatedHours(t.estimatedHours),
  };
}
