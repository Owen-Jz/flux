import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    checkUserRateLimit,
    checkApiKeyRateLimit,
    getApiKeyFromRequest,
    USER_LIMIT,
    USER_WINDOW_MS,
    API_KEY_LIMIT,
    API_KEY_WINDOW_MS
} from '../lib/rate-limit-enhanced';

// Mock NextRequest
class MockHeaders {
    private headers: Map<string, string>;

    constructor(init?: Record<string, string>) {
        this.headers = new Map(Object.entries(init || {}));
    }

    get(name: string): string | null {
        return this.headers.get(name) || null;
    }
}

class MockNextRequest {
    headers: MockHeaders;

    constructor(headers?: Record<string, string>) {
        this.headers = new MockHeaders(headers);
    }
}

describe('Enhanced Rate Limiter', () => {
    beforeEach(() => {
        // Clear stores before each test
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('checkUserRateLimit', () => {
        it('should allow requests under user limit', () => {
            const userId = 'user-123';

            // First request should succeed
            const result1 = checkUserRateLimit(userId);
            expect(result1.success).toBe(true);
            expect(result1.remaining).toBe(USER_LIMIT - 1);
            expect(result1.limitType).toBe('user');

            // Second request should also succeed
            const result2 = checkUserRateLimit(userId);
            expect(result2.success).toBe(true);
            expect(result2.remaining).toBe(USER_LIMIT - 2);
        });

        it('should block requests over user limit (20 per hour)', () => {
            const userId = 'user-limit-test';

            // Make requests up to the limit
            for (let i = 0; i < USER_LIMIT; i++) {
                const result = checkUserRateLimit(userId);
                expect(result.success).toBe(true);
            }

            // The 21st request should be blocked
            const blockedResult = checkUserRateLimit(userId);
            expect(blockedResult.success).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.limitType).toBe('user');
        });

        it('should track different users separately', () => {
            const user1 = 'user-1';
            const user2 = 'user-2';

            // Fill up user1's limit
            for (let i = 0; i < USER_LIMIT; i++) {
                checkUserRateLimit(user1);
            }

            // user1 should be blocked
            const user1Blocked = checkUserRateLimit(user1);
            expect(user1Blocked.success).toBe(false);

            // user2 should still be allowed
            const user2Allowed = checkUserRateLimit(user2);
            expect(user2Allowed.success).toBe(true);
            expect(user2Allowed.remaining).toBe(USER_LIMIT - 1);
        });

        it('should return correct resetIn value', () => {
            const userId = 'user-reset-test';

            // Fill up the limit
            for (let i = 0; i < USER_LIMIT; i++) {
                checkUserRateLimit(userId);
            }

            // Blocked request should have resetIn > 0
            const result = checkUserRateLimit(userId);
            expect(result.success).toBe(false);
            expect(result.resetIn).toBeGreaterThan(0);
            expect(result.resetIn).toBeLessThanOrEqual(USER_WINDOW_MS / 1000);
        });
    });

    describe('checkApiKeyRateLimit', () => {
        it('should allow requests under API key limit', () => {
            const apiKey = 'api-key-123';

            // First request should succeed
            const result1 = checkApiKeyRateLimit(apiKey);
            expect(result1.success).toBe(true);
            expect(result1.remaining).toBe(API_KEY_LIMIT - 1);
            expect(result1.limitType).toBe('apiKey');

            // Second request should also succeed
            const result2 = checkApiKeyRateLimit(apiKey);
            expect(result2.success).toBe(true);
            expect(result2.remaining).toBe(API_KEY_LIMIT - 2);
        });

        it('should block requests over API key limit (100 per 24h)', () => {
            const apiKey = 'api-key-limit-test';

            // Make requests up to the limit
            for (let i = 0; i < API_KEY_LIMIT; i++) {
                const result = checkApiKeyRateLimit(apiKey);
                expect(result.success).toBe(true);
            }

            // The 101st request should be blocked
            const blockedResult = checkApiKeyRateLimit(apiKey);
            expect(blockedResult.success).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.limitType).toBe('apiKey');
        });

        it('should track different API keys separately', () => {
            const apiKey1 = 'api-key-1';
            const apiKey2 = 'api-key-2';

            // Fill up apiKey1's limit
            for (let i = 0; i < API_KEY_LIMIT; i++) {
                checkApiKeyRateLimit(apiKey1);
            }

            // apiKey1 should be blocked
            const apiKey1Blocked = checkApiKeyRateLimit(apiKey1);
            expect(apiKey1Blocked.success).toBe(false);

            // apiKey2 should still be allowed
            const apiKey2Allowed = checkApiKeyRateLimit(apiKey2);
            expect(apiKey2Allowed.success).toBe(true);
            expect(apiKey2Allowed.remaining).toBe(API_KEY_LIMIT - 1);
        });
    });

    describe('getApiKeyFromRequest', () => {
        it('should extract Bearer token from Authorization header', () => {
            const request = new MockNextRequest({
                'Authorization': 'Bearer test-api-key-123'
            });

            const result = getApiKeyFromRequest(request as any);
            expect(result).toBe('test-api-key-123');
        });

        it('should return null when Authorization header is missing', () => {
            const request = new MockNextRequest({});

            const result = getApiKeyFromRequest(request as any);
            expect(result).toBeNull();
        });

        it('should return null when Authorization header does not have Bearer prefix', () => {
            const request = new MockNextRequest({
                'Authorization': 'Basic some-token'
            });

            const result = getApiKeyFromRequest(request as any);
            expect(result).toBeNull();
        });

        it('should return null when Bearer token is empty', () => {
            const request = new MockNextRequest({
                'Authorization': 'Bearer '
            });

            const result = getApiKeyFromRequest(request as any);
            expect(result).toBeNull();
        });

        it('should handle Authorization header with extra spaces', () => {
            const request = new MockNextRequest({
                'Authorization': 'Bearer   my-api-key'
            });

            const result = getApiKeyFromRequest(request as any);
            expect(result).toBe('  my-api-key');
        });
    });

    describe('Retry-After header value', () => {
        it('should return correct resetIn for Retry-After header', () => {
            const userId = 'user-retry-after-test';

            // Fill up the limit
            for (let i = 0; i < USER_LIMIT; i++) {
                checkUserRateLimit(userId);
            }

            // The blocked result should have resetIn that can be used as Retry-After value
            const result = checkUserRateLimit(userId);
            expect(result.success).toBe(false);
            expect(result.resetIn).toBeGreaterThan(0);

            // The resetIn should be in seconds (for Retry-After header)
            expect(Number.isInteger(result.resetIn)).toBe(true);
        });

        it('should return seconds until reset for API key limit', () => {
            const apiKey = 'api-key-retry-after-test';

            // Fill up the limit
            for (let i = 0; i < API_KEY_LIMIT; i++) {
                checkApiKeyRateLimit(apiKey);
            }

            const result = checkApiKeyRateLimit(apiKey);
            expect(result.success).toBe(false);
            expect(result.resetIn).toBeGreaterThan(0);
            expect(result.resetIn).toBeLessThanOrEqual(API_KEY_WINDOW_MS / 1000);
        });
    });

    describe('Configuration constants', () => {
        it('should have correct USER_LIMIT', () => {
            expect(USER_LIMIT).toBe(20);
        });

        it('should have correct USER_WINDOW_MS', () => {
            expect(USER_WINDOW_MS).toBe(60 * 60 * 1000); // 60 minutes
        });

        it('should have correct API_KEY_LIMIT', () => {
            expect(API_KEY_LIMIT).toBe(100);
        });

        it('should have correct API_KEY_WINDOW_MS', () => {
            expect(API_KEY_WINDOW_MS).toBe(24 * 60 * 60 * 1000); // 24 hours
        });
    });
});
