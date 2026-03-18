// Enhanced dual-window rate limiter for LLM API quota protection
import { NextRequest } from 'next/server';

// Configuration constants
export const USER_LIMIT = 20;
export const USER_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
export const API_KEY_LIMIT = 100;
export const API_KEY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Dual-window in-memory stores
const userRateLimitStore = new Map<string, RateLimitEntry>();
const apiKeyRateLimitStore = new Map<string, RateLimitEntry>();

export interface EnhancedRateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number; // seconds
    limitType: 'user' | 'apiKey';
}

/**
 * Clean up expired entries from rate limit stores
 * Runs every 60 seconds to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();

    // Clean up user rate limit store
    for (const [key, entry] of userRateLimitStore.entries()) {
        if (entry.resetTime < now) {
            userRateLimitStore.delete(key);
        }
    }

    // Clean up API key rate limit store
    for (const [key, entry] of apiKeyRateLimitStore.entries()) {
        if (entry.resetTime < now) {
            apiKeyRateLimitStore.delete(key);
        }
    }
}

// Start cleanup interval (every 60 seconds)
setInterval(cleanupExpiredEntries, 60 * 1000);

/**
 * Check rate limit for a user (20 requests per hour)
 * @param userId - Unique user identifier
 */
export function checkUserRateLimit(userId: string): EnhancedRateLimitResult {
    const now = Date.now();
    const windowMs = USER_WINDOW_MS;
    const maxAttempts = USER_LIMIT;
    const key = userId;

    const entry = userRateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // New window
        userRateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: maxAttempts - 1,
            resetIn: Math.ceil(windowMs / 1000),
            limitType: 'user',
        };
    }

    if (entry.count >= maxAttempts) {
        // Rate limited
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        return {
            success: false,
            remaining: 0,
            resetIn,
            limitType: 'user',
        };
    }

    // Increment count
    entry.count++;
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return {
        success: true,
        remaining: maxAttempts - entry.count,
        resetIn,
        limitType: 'user',
    };
}

/**
 * Check rate limit for an API key (100 requests per 24 hours)
 * @param apiKey - Unique API key
 */
export function checkApiKeyRateLimit(apiKey: string): EnhancedRateLimitResult {
    const now = Date.now();
    const windowMs = API_KEY_WINDOW_MS;
    const maxAttempts = API_KEY_LIMIT;
    const key = apiKey;

    const entry = apiKeyRateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // New window
        apiKeyRateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: maxAttempts - 1,
            resetIn: Math.ceil(windowMs / 1000),
            limitType: 'apiKey',
        };
    }

    if (entry.count >= maxAttempts) {
        // Rate limited
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        return {
            success: false,
            remaining: 0,
            resetIn,
            limitType: 'apiKey',
        };
    }

    // Increment count
    entry.count++;
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return {
        success: true,
        remaining: maxAttempts - entry.count,
        resetIn,
        limitType: 'apiKey',
    };
}

/**
 * Extract API key from request Authorization header
 * @param request - Next.js request object
 * @returns Bearer token or null if not found
 */
export function getApiKeyFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
        return null;
    }

    // Check for Bearer token format
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        return token || null;
    }

    return null;
}
