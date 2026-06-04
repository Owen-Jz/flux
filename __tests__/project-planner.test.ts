import { describe, it, expect } from 'vitest';
import {
  buildProjectPlanUserPrompt,
  parseProjectPlanResponse,
} from '../lib/llm/project-planner';
import type { ProjectPlanRequest } from '../lib/llm/types';

// A reusable valid task and board for building fixtures.
const validTask = { title: 'Build it', description: 'do the thing', priority: 'High', estimatedHours: 3 };
const validBoard = { name: 'Design', description: 'the design work', tasks: [validTask] };

describe('buildProjectPlanUserPrompt', () => {
  const base: ProjectPlanRequest = { description: 'A shop', scale: 'project' };

  it('includes the description and the project-plan instruction', () => {
    const p = buildProjectPlanUserPrompt(base);
    expect(p).toContain('A shop');
    expect(p).toContain('multi-board project plan');
  });

  it('uses task-list wording for board scale', () => {
    const p = buildProjectPlanUserPrompt({ ...base, scale: 'board' });
    expect(p).toContain('task list');
  });

  it('includes deadline and maxTasksPerBoard, and drops unsafe links', () => {
    const p = buildProjectPlanUserPrompt({
      ...base,
      deadline: '2026-08-01',
      maxTasksPerBoard: 6,
      contextLinks: ['javascript:alert(1)', 'https://ok.com'],
    });
    expect(p).toContain('2026-08-01');
    expect(p).toContain('6');
    expect(p).toContain('https://ok.com');
    expect(p).not.toContain('javascript:');
  });
});

describe('parseProjectPlanResponse — shared', () => {
  it('throws on empty content', () => {
    expect(() => parseProjectPlanResponse('', 'board')).toThrow('No content in LLM response');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseProjectPlanResponse('not json at all', 'board')).toThrow('Failed to parse LLM response as JSON');
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const fenced = '```json\n' + JSON.stringify({ title: 'T', summary: 'S', tasks: [validTask] }) + '\n```';
    const result = parseProjectPlanResponse(fenced, 'board');
    expect(result.title).toBe('T');
    expect(result.tasks).toHaveLength(1);
  });

  it('throws when title is missing', () => {
    const json = JSON.stringify({ summary: 'S', tasks: [validTask] });
    expect(() => parseProjectPlanResponse(json, 'board')).toThrow('Plan missing required field: title');
  });

  it('throws when summary is missing', () => {
    const json = JSON.stringify({ title: 'T', tasks: [validTask] });
    expect(() => parseProjectPlanResponse(json, 'board')).toThrow('Plan missing required field: summary');
  });
});

describe('parseProjectPlanResponse — board scale', () => {
  it('parses a valid board plan', () => {
    const json = JSON.stringify({ title: 'T', summary: 'S', tasks: [validTask] });
    const result = parseProjectPlanResponse(json, 'board');
    expect(result.tasks).toHaveLength(1);
  });

  it('throws when tasks array is missing or empty', () => {
    expect(() => parseProjectPlanResponse(JSON.stringify({ title: 'T', summary: 'S' }), 'board'))
      .toThrow('Board plan missing tasks array');
    expect(() => parseProjectPlanResponse(JSON.stringify({ title: 'T', summary: 'S', tasks: [] }), 'board'))
      .toThrow('Board plan missing tasks array');
  });

  it('throws when a task is missing required fields', () => {
    const json = JSON.stringify({ title: 'T', summary: 'S', tasks: [{ title: 'x', priority: 'High', estimatedHours: 2 }] });
    expect(() => parseProjectPlanResponse(json, 'board')).toThrow('Task missing required fields');
  });

  it('throws when estimatedHours is not a positive number', () => {
    const json = JSON.stringify({ title: 'T', summary: 'S', tasks: [{ ...validTask, estimatedHours: 0 }] });
    expect(() => parseProjectPlanResponse(json, 'board')).toThrow('Task missing required fields');
  });

  it('throws on an invalid priority enum', () => {
    const json = JSON.stringify({ title: 'T', summary: 'S', tasks: [{ ...validTask, priority: 'Urgent' }] });
    expect(() => parseProjectPlanResponse(json, 'board')).toThrow('Invalid priority value: Urgent');
  });
});

describe('parseProjectPlanResponse — project scale', () => {
  it('parses a valid project plan', () => {
    const json = JSON.stringify({ title: 'T', summary: 'S', boards: [validBoard] });
    const result = parseProjectPlanResponse(json, 'project');
    expect(result.boards).toHaveLength(1);
  });

  it('throws when boards array is missing or empty', () => {
    expect(() => parseProjectPlanResponse(JSON.stringify({ title: 'T', summary: 'S' }), 'project'))
      .toThrow('Project plan missing boards array');
    expect(() => parseProjectPlanResponse(JSON.stringify({ title: 'T', summary: 'S', boards: [] }), 'project'))
      .toThrow('Project plan missing boards array');
  });

  it('throws when a board is missing fields or has no tasks', () => {
    const noTasks = JSON.stringify({ title: 'T', summary: 'S', boards: [{ name: 'D', description: 'd', tasks: [] }] });
    expect(() => parseProjectPlanResponse(noTasks, 'project')).toThrow('Board missing required fields');
  });

  it('throws when a nested task has an invalid priority', () => {
    const json = JSON.stringify({
      title: 'T', summary: 'S',
      boards: [{ name: 'D', description: 'd', tasks: [{ ...validTask, priority: 'Critical' }] }],
    });
    expect(() => parseProjectPlanResponse(json, 'project')).toThrow('Invalid priority value: Critical');
  });
});
