import { ProjectPlanRequest } from './types';

export const BOARD_PLAN_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, generate a flat list of tasks to accomplish it.

Output valid JSON only — no markdown, no explanation:
{
  "title": "short project title (≤60 chars)",
  "summary": "one-sentence overview",
  "tasks": [
    {
      "title": "task title (≤80 chars)",
      "description": "what to do and how (≤300 chars)",
      "priority": "High|Medium|Low",
      "estimatedHours": <number>
    }
  ]
}

Rules:
- 5-15 tasks (or up to maxTasksPerBoard if specified)
- Order tasks logically (dependencies first)
- Titles are imperative: "Build the homepage", not "Homepage"
- estimatedHours is a realistic integer 1-24
- Respond ONLY with valid JSON`;

export const PROJECT_PLAN_SYSTEM_PROMPT = `You are a project planning assistant. Given a project description, create a multi-board project plan where each board is a major workstream or phase.

Output valid JSON only — no markdown, no explanation:
{
  "title": "project title (≤60 chars)",
  "summary": "one-sentence overview",
  "boards": [
    {
      "name": "Board Name (≤40 chars)",
      "description": "what this workstream covers (≤120 chars)",
      "tasks": [
        {
          "title": "task title (≤80 chars)",
          "description": "what to do and how (≤300 chars)",
          "priority": "High|Medium|Low",
          "estimatedHours": <number>
        }
      ]
    }
  ]
}

Rules:
- 2-6 boards max (workstreams like Design, Development, Marketing, QA, Launch)
- 3-10 tasks per board (or up to maxTasksPerBoard if specified)
- Board names are clear workstream labels
- Tasks are specific and actionable
- estimatedHours is a realistic integer 1-24
- Respond ONLY with valid JSON`;

export function buildProjectPlanUserPrompt(req: ProjectPlanRequest): string {
  let prompt = `Project description:\n${req.description}\n\n`;

  if (req.deadline) {
    prompt += `Target completion date: ${req.deadline}\n\n`;
  }

  if (req.contextLinks && req.contextLinks.length > 0) {
    prompt += `Reference links:\n${req.contextLinks.map(l => `- ${l}`).join('\n')}\n\n`;
  }

  if (req.maxTasksPerBoard) {
    prompt += `Maximum tasks per board: ${req.maxTasksPerBoard}\n\n`;
  }

  prompt += `Generate a ${req.scale === 'project' ? 'multi-board project plan' : 'task list'} for this.`;
  return prompt;
}
