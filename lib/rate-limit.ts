// Simple in-memory rate limiter
// For production, use Redis or similar distributed store
import { NextRequest } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // Clean up every minute

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number; // seconds
}

/**
 * Simple rate limiter using in-memory storage
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export function rateLimit(
    identifier: string,
    maxAttempts: number = 5,
    windowSeconds: number = 60 * 15 // 15 minutes default
): RateLimitResult {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const key = identifier;

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: maxAttempts - 1,
            resetIn: windowSeconds,
        };
    }

    if (entry.count >= maxAttempts) {
        // Rate limited
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        return {
            success: false,
            remaining: 0,
            resetIn,
        };
    }

    // Increment count
    entry.count++;
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return {
        success: true,
        remaining: maxAttempts - entry.count,
        resetIn,
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: NextRequest): string {
    // Check various headers in order of preference
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    return 'unknown';
}
