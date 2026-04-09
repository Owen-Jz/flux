import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import * as paystack from '../lib/paystack';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Paystack', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        // Reset environment variables
        process.env.PAYSTACK_SECRET_KEY = 'test-secret-key';
        process.env.EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('verifyWebhookSignature', () => {
        it('returns true when signature matches', () => {
            const payload = '{"event":"charge.success"}';
            const secretKey = process.env.PAYSTACK_SECRET_KEY!;
            const expectedHash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');

            const result = paystack.verifyWebhookSignature(payload, expectedHash);
            expect(result).toBe(true);
        });

        it('returns false when signature does not match', () => {
            const payload = '{"event":"charge.success"}';
            const wrongSignature = 'invalid-signature-hash';

            const result = paystack.verifyWebhookSignature(payload, wrongSignature);
            expect(result).toBe(false);
        });

        it('handles empty string payload', () => {
            const payload = '';
            const secretKey = process.env.PAYSTACK_SECRET_KEY!;
            const expectedHash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');

            const result = paystack.verifyWebhookSignature(payload, expectedHash);
            expect(result).toBe(true);
        });

        it('handles JSON string payload', () => {
            const payload = JSON.stringify({ event: 'transfer.success', data: { id: 123 } });
            const secretKey = process.env.PAYSTACK_SECRET_KEY!;
            const expectedHash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');

            const result = paystack.verifyWebhookSignature(payload, expectedHash);
            expect(result).toBe(true);
        });

        it('produces different hashes for different payloads', () => {
            const payload1 = '{"event":"charge.success"}';
            const payload2 = '{"event":"transfer.success"}';
            const secretKey = process.env.PAYSTACK_SECRET_KEY!;

            const hash1 = crypto.createHmac('sha512', secretKey).update(payload1).digest('hex');
            const hash2 = crypto.createHmac('sha512', secretKey).update(payload2).digest('hex');

            expect(hash1).not.toBe(hash2);

            // payload1 hash should verify against payload1
            expect(paystack.verifyWebhookSignature(payload1, hash1)).toBe(true);
            // payload2 hash should verify against payload2
            expect(paystack.verifyWebhookSignature(payload2, hash2)).toBe(true);
            // cross-verification should fail
            expect(paystack.verifyWebhookSignature(payload1, hash2)).toBe(false);
            expect(paystack.verifyWebhookSignature(payload2, hash1)).toBe(false);
        });
    });

    describe('withRetry', () => {
        it('succeeds on first attempt if function succeeds', async () => {
            const mockFn = vi.fn().mockResolvedValue('success');

            const result = await paystack.withRetry(mockFn, 3, 10);

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('retries 3 times on failure before throwing', async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockRejectedValueOnce(new Error('Fail 3'));

            const resultPromise = paystack.withRetry(mockFn, 3, 10);

            // First attempt
            await vi.advanceTimersByTimeAsync(0);
            // First retry delay (10ms)
            await vi.advanceTimersByTimeAsync(10);
            // Second retry delay (20ms)
            await vi.advanceTimersByTimeAsync(20);

            await expect(resultPromise).rejects.toThrow('Fail 3');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        it('exponential backoff: 10ms, 20ms delays between retries', async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValue('success');

            const resultPromise = paystack.withRetry(mockFn, 3, 10);

            // First attempt fails immediately
            await vi.advanceTimersByTimeAsync(0);
            expect(mockFn).toHaveBeenCalledTimes(1);

            // First retry delay (10ms * 2^0 = 10ms)
            await vi.advanceTimersByTimeAsync(10);
            expect(mockFn).toHaveBeenCalledTimes(2);

            // Second retry delay (10ms * 2^1 = 20ms)
            await vi.advanceTimersByTimeAsync(20);
            expect(mockFn).toHaveBeenCalledTimes(3);

            const result = await resultPromise;
            expect(result).toBe('success');
        });

        it('returns result immediately if function succeeds on retry', async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockResolvedValue('success on retry');

            const resultPromise = paystack.withRetry(mockFn, 3, 10);

            // First attempt fails
            await vi.advanceTimersByTimeAsync(0);
            expect(mockFn).toHaveBeenCalledTimes(1);

            // Retry after 10ms delay
            await vi.advanceTimersByTimeAsync(10);
            expect(mockFn).toHaveBeenCalledTimes(2);

            const result = await resultPromise;
            expect(result).toBe('success on retry');
        });

        it('throws last error after max attempts', async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockRejectedValueOnce(new Error('Error 2'))
                .mockRejectedValueOnce(new Error('Error 3'));

            const resultPromise = paystack.withRetry(mockFn, 3, 10);

            // First attempt
            await vi.advanceTimersByTimeAsync(0);
            // First retry
            await vi.advanceTimersByTimeAsync(10);
            // Second retry
            await vi.advanceTimersByTimeAsync(20);

            await expect(resultPromise).rejects.toThrow('Error 3');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        it('respects custom maxAttempts and baseDelayMs', async () => {
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockResolvedValue('success');

            const resultPromise = paystack.withRetry(mockFn, 2, 5); // maxAttempts=2, baseDelayMs=5

            // First attempt fails
            await vi.advanceTimersByTimeAsync(0);
            // Retry after 5ms
            await vi.advanceTimersByTimeAsync(5);

            const result = await resultPromise;
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('getExchangeRate', () => {
        // Need to reset module state between tests
        beforeEach(() => {
            // Reset module-level cache by clearing the module cache
            vi.resetModules();
            // Re-import after resetting to get fresh state
        });

        it('returns cached rate if still valid', async () => {
            // First call to set cache
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ rates: { NGN: 1650 } })
            });

            const { getExchangeRate } = await import('../lib/paystack');

            // First call - should fetch
            const rate1 = await getExchangeRate();
            expect(rate1).toBe(1650);
            expect(mockFetch).toHaveBeenCalledTimes(1);

            // Advance time by less than 1 hour
            vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

            // Second call - should use cache
            const rate2 = await getExchangeRate();
            expect(rate2).toBe(1650);
            expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
        });

        it('fetches new rate if cache expired', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ rates: { NGN: 1650 } })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ rates: { NGN: 1700 } })
                });

            const { getExchangeRate } = await import('../lib/paystack');

            // First call - should fetch
            const rate1 = await getExchangeRate();
            expect(rate1).toBe(1650);

            // Advance time by more than 1 hour
            vi.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

            // Second call - should fetch new rate
            const rate2 = await getExchangeRate();
            expect(rate2).toBe(1700);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('falls back to default rate (1700) on API failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { getExchangeRate } = await import('../lib/paystack');

            const rate = await getExchangeRate();
            expect(rate).toBe(1700);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('uses EXCHANGE_RATE_API_URL from env', async () => {
            process.env.EXCHANGE_RATE_API_URL = 'https://custom-api.example.com/v4/latest/USD';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ rates: { NGN: 1800 } })
            });

            const { getExchangeRate } = await import('../lib/paystack');

            await getExchangeRate();

            expect(mockFetch).toHaveBeenCalledWith(
                'https://custom-api.example.com/v4/latest/USD',
                expect.any(Object)
            );
        });

        it('uses default exchange rate API URL if env not set', async () => {
            delete process.env.EXCHANGE_RATE_API_URL;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ rates: { NGN: 1750 } })
            });

            const { getExchangeRate } = await import('../lib/paystack');

            await getExchangeRate();

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.exchangerate-api.com/v4/latest/USD',
                expect.any(Object)
            );
        });

        it('returns cached rate on API error if cache exists', async () => {
            // First, set a valid cache
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ rates: { NGN: 1600 } })
            });

            const { getExchangeRate } = await import('../lib/paystack');

            // First call - sets cache
            const rate1 = await getExchangeRate();
            expect(rate1).toBe(1600);

            // API fails on second call
            mockFetch.mockRejectedValueOnce(new Error('API Error'));

            // Advance time by more than 1 hour to force new fetch
            vi.advanceTimersByTime(61 * 60 * 1000);

            // Should return cached rate, not default
            const rate2 = await getExchangeRate();
            expect(rate2).toBe(1600);
        });
    });
});
