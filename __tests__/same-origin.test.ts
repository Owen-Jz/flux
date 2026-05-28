import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSameOrigin } from '../lib/rate-limit';

class MockHeaders {
    private headers: Map<string, string>;
    constructor(init?: Record<string, string>) {
        this.headers = new Map(Object.entries(init || {}));
    }
    get(name: string): string | null {
        return this.headers.get(name) ?? null;
    }
}

function makeRequest(headers: Record<string, string>) {
    return { headers: new MockHeaders(headers) } as unknown as Parameters<typeof isSameOrigin>[0];
}

describe('isSameOrigin (CSRF check)', () => {
    const originalNextAuthUrl = process.env.NEXTAUTH_URL;
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    beforeEach(() => {
        delete process.env.NEXTAUTH_URL;
        delete process.env.NEXT_PUBLIC_APP_URL;
    });

    afterEach(() => {
        if (originalNextAuthUrl !== undefined) process.env.NEXTAUTH_URL = originalNextAuthUrl;
        if (originalAppUrl !== undefined) process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    });

    it('returns true when Origin header is absent', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({}))).toBe(true);
    });

    it('returns true for exact origin match', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://www.fluxboard.site' }))).toBe(true);
    });

    // The bug from the screenshot: NEXTAUTH_URL has www, browser hits apex
    it('returns true when NEXTAUTH_URL is www and request Origin is apex', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://fluxboard.site' }))).toBe(true);
    });

    // The reverse direction
    it('returns true when NEXTAUTH_URL is apex and request Origin is www', () => {
        process.env.NEXTAUTH_URL = 'https://fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://www.fluxboard.site' }))).toBe(true);
    });

    it('uses NEXT_PUBLIC_APP_URL when NEXTAUTH_URL is not set', () => {
        process.env.NEXT_PUBLIC_APP_URL = 'https://fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://fluxboard.site' }))).toBe(true);
        expect(isSameOrigin(makeRequest({ origin: 'https://www.fluxboard.site' }))).toBe(true);
    });

    it('falls back to localhost:3000 when neither env var is set', () => {
        expect(isSameOrigin(makeRequest({ origin: 'http://localhost:3000' }))).toBe(true);
    });

    // CSRF protection is preserved
    it('rejects cross-origin requests from a different site', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://evil.com' }))).toBe(false);
    });

    it('rejects www variant of a different site', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://www.evil.com' }))).toBe(false);
    });

    it('rejects HTTP when configured for HTTPS', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'http://www.fluxboard.site' }))).toBe(false);
    });

    it('rejects different port on same host', () => {
        process.env.NEXTAUTH_URL = 'http://localhost:3000';
        expect(isSameOrigin(makeRequest({ origin: 'http://localhost:4000' }))).toBe(false);
    });

    it('rejects a malformed Origin header', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'not a url' }))).toBe(false);
    });

    it('rejects a subdomain that is not www', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site';
        expect(isSameOrigin(makeRequest({ origin: 'https://api.fluxboard.site' }))).toBe(false);
    });

    it('tolerates trailing slash on the env URL', () => {
        process.env.NEXTAUTH_URL = 'https://www.fluxboard.site/';
        expect(isSameOrigin(makeRequest({ origin: 'https://fluxboard.site' }))).toBe(true);
    });
});
