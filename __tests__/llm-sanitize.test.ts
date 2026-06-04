import { describe, it, expect } from 'vitest';
import { sanitizeContextLinks } from '../lib/llm/sanitize';

describe('sanitizeContextLinks', () => {
  it('keeps http and https URLs', () => {
    expect(sanitizeContextLinks(['http://a.com', 'https://b.com'])).toEqual(['http://a.com', 'https://b.com']);
  });

  it('drops non-http(s) schemes and junk', () => {
    expect(sanitizeContextLinks(['javascript:alert(1)', 'ftp://x', 'data:text/html,x', 'https://ok.com']))
      .toEqual(['https://ok.com']);
  });

  it('drops non-string entries', () => {
    expect(sanitizeContextLinks(['https://ok.com', 42, null, undefined, { url: 'x' }] as unknown))
      .toEqual(['https://ok.com']);
  });

  it('returns [] for non-array input', () => {
    expect(sanitizeContextLinks(undefined)).toEqual([]);
    expect(sanitizeContextLinks('https://a.com')).toEqual([]);
    expect(sanitizeContextLinks(null)).toEqual([]);
  });

  it('caps the count at 5 by default', () => {
    const links = Array.from({ length: 10 }, (_, i) => `https://site${i}.com`);
    expect(sanitizeContextLinks(links)).toHaveLength(5);
  });

  it('drops URLs longer than the length bound', () => {
    const long = 'https://a.com/' + 'x'.repeat(600);
    expect(sanitizeContextLinks([long, 'https://ok.com'])).toEqual(['https://ok.com']);
  });

  it('honors custom maxLen and max options', () => {
    // 'https://aaaa.com' is 16 chars (dropped at maxLen 14), 'https://b.com' is 13 (kept).
    expect(sanitizeContextLinks(['https://aaaa.com', 'https://b.com'], { maxLen: 14 }))
      .toEqual(['https://b.com']);
    expect(sanitizeContextLinks(['https://a.com', 'https://b.com', 'https://c.com'], { max: 2 }))
      .toHaveLength(2);
  });
});
