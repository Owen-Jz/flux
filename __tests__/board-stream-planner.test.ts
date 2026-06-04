import { describe, it, expect } from 'vitest';
import {
  buildSkeletonUserPrompt,
  buildSectionUserPrompt,
  parseSkeletonResponse,
  parseSectionResponse,
  normalizePriority,
  normalizeStatus,
  normalizeEstimatedHours,
  normalizeSectionTask,
} from '../lib/llm/board-stream-planner';

describe('buildSkeletonUserPrompt', () => {
  it('includes the description', () => {
    const p = buildSkeletonUserPrompt({ description: 'Build a shop' });
    expect(p).toContain('Build a shop');
    expect(p).toContain('3-5 high-level sections');
  });
  it('includes deadline and maxTasks when provided', () => {
    const p = buildSkeletonUserPrompt({ description: 'X', deadline: '2026-07-01', maxTasks: 10 });
    expect(p).toContain('2026-07-01');
    expect(p).toContain('about 10 tasks');
  });
  it('drops non-http context links', () => {
    const p = buildSkeletonUserPrompt({ description: 'X', contextLinks: ['javascript:alert(1)', 'https://ok.com'] });
    expect(p).toContain('https://ok.com');
    expect(p).not.toContain('javascript:');
  });
});

describe('buildSectionUserPrompt', () => {
  it('names the target section and lists all sections', () => {
    const sections = [
      { name: 'Setup', description: 'init' },
      { name: 'Build', description: 'core' },
    ];
    const p = buildSectionUserPrompt({
      description: 'App', section: sections[1], allSections: sections, maxTasksForSection: 4,
    });
    expect(p).toContain('up to 4 tasks');
    expect(p).toContain('"Build"');
    expect(p).toContain('1. Setup');
  });
});

describe('parseSkeletonResponse', () => {
  it('parses a valid skeleton', () => {
    const r = parseSkeletonResponse(JSON.stringify({
      title: 'T', summary: 'S', sections: [{ name: 'A', description: 'd' }],
    }));
    expect(r.sections).toHaveLength(1);
  });
  it('parses skeleton wrapped in a code fence', () => {
    const r = parseSkeletonResponse('```json\n{"title":"T","summary":"S","sections":[{"name":"A","description":"d"}]}\n```');
    expect(r.title).toBe('T');
  });
  it('throws on invalid JSON', () => {
    expect(() => parseSkeletonResponse('not json')).toThrow();
  });
  it('throws when sections missing', () => {
    expect(() => parseSkeletonResponse(JSON.stringify({ title: 'T', summary: 'S' }))).toThrow();
  });
});

describe('parseSectionResponse', () => {
  it('parses a valid section', () => {
    const r = parseSectionResponse(JSON.stringify({
      tasks: [{ title: 'a', description: 'b', priority: 'High', status: 'Todo', estimatedHours: 3 }],
    }));
    expect(r.tasks).toHaveLength(1);
  });
  it('throws on empty tasks', () => {
    expect(() => parseSectionResponse(JSON.stringify({ tasks: [] }))).toThrow();
  });
  it('throws on missing fields', () => {
    expect(() => parseSectionResponse(JSON.stringify({ tasks: [{ title: 'a' }] }))).toThrow();
  });
});

describe('normalizePriority', () => {
  it('maps title-case and falls back to MEDIUM', () => {
    expect(normalizePriority('High')).toBe('HIGH');
    expect(normalizePriority('weird')).toBe('MEDIUM');
  });
});

describe('normalizeStatus', () => {
  it('maps allowed values', () => {
    expect(normalizeStatus('Backlog')).toBe('BACKLOG');
    expect(normalizeStatus('Todo')).toBe('TODO');
    expect(normalizeStatus('In Progress')).toBe('IN_PROGRESS');
  });
  it('clamps unknown / disallowed values to BACKLOG', () => {
    expect(normalizeStatus('Done')).toBe('BACKLOG');
    expect(normalizeStatus('Review')).toBe('BACKLOG');
    expect(normalizeStatus('')).toBe('BACKLOG');
  });
});

describe('normalizeEstimatedHours', () => {
  it('keeps a valid integer in range', () => {
    expect(normalizeEstimatedHours(3)).toBe(3);
    expect(normalizeEstimatedHours(24)).toBe(24);
  });
  it('rounds fractional values', () => {
    expect(normalizeEstimatedHours(2.4)).toBe(2);
    expect(normalizeEstimatedHours(2.6)).toBe(3);
  });
  it('clamps values above 24', () => {
    expect(normalizeEstimatedHours(1000)).toBe(24);
  });
  it('defaults to 2 for NaN, Infinity, zero, negatives, and non-numbers', () => {
    expect(normalizeEstimatedHours(NaN)).toBe(2);
    expect(normalizeEstimatedHours(Infinity)).toBe(2);
    expect(normalizeEstimatedHours(0)).toBe(2);
    expect(normalizeEstimatedHours(-5)).toBe(2);
    expect(normalizeEstimatedHours('3' as unknown)).toBe(2);
    expect(normalizeEstimatedHours(undefined)).toBe(2);
  });
});

describe('normalizeSectionTask', () => {
  it('normalizes priority and status together', () => {
    const t = normalizeSectionTask({
      title: 'a', description: 'b', priority: 'Low', status: 'Done' as 'Backlog', estimatedHours: 2,
    });
    expect(t.priority).toBe('LOW');
    expect(t.status).toBe('BACKLOG');
  });
  it('clamps a garbage estimatedHours to the safe default', () => {
    const t = normalizeSectionTask({
      title: 'a', description: 'b', priority: 'High', status: 'Todo' as 'Backlog',
      estimatedHours: Number.POSITIVE_INFINITY,
    });
    expect(t.estimatedHours).toBe(2);
  });
});
