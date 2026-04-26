/**
 * IMPORTANT: This rate limiter uses in-memory storage.
 * For production deployments with multiple instances, use Redis-based rate limiting.
 * See: https://redis.io/docs/connect/clients/nodejs/redis Rate limiting
 */
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
 * SECURITY FIX: Validates X-Forwarded-For against trusted proxy IPs to prevent spoofing
 */
const TRUSTED_PROXY_IPS = process.env.TRUSTED_PROXY_IPS?.split(',').map(ip => ip.trim()) || [];

function isTrustedProxy(ip: string): boolean {
    return TRUSTED_PROXY_IPS.length === 0 || TRUSTED_PROXY_IPS.includes(ip);
}

function isValidIp(ip: string): boolean {
    // Basic validation to reject obviously spoofed values
    // Reject obviously fake IPs like private IPs when not from trusted proxy
    const privateIpPatterns = [
        /^127\./, // localhost
        /^10\./, // Class A private
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
        /^192\.168\./, // Class C private
        /^169\.254\./, // Link-local
        /^0\./, // Current network
    ];
    if (!isTrustedProxy(ip)) {
        for (const pattern of privateIpPatterns) {
            if (pattern.test(ip)) {
                return false;
            }
        }
    }
    return true;
}

export function getClientIp(request: NextRequest): string {
    // Check X-Forwarded-For header first (may be spoofed by attackers)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const clientIp = forwarded.split(',')[0].trim();
        // SECURITY: Only trust X-Forwarded-For from known proxies
        if (isTrustedProxy(clientIp) || isValidIp(clientIp)) {
            return clientIp;
        }
    }

    // Check X-Real-IP header
    const realIp = request.headers.get('x-real-ip');
    if (realIp && isValidIp(realIp)) {
        return realIp;
    }

    // Fallback: derive from request connection info if available
    return 'unknown';
}
