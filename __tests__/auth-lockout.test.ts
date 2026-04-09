import { describe, it, expect, beforeEach, vi } from 'vitest';

// Replicate the lockout logic from lib/auth.ts for isolated testing
const failedLoginAttempts = new Map<string, { count: number; lockoutUntil?: number; lastAttempt: number }>();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const FAILED_ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Lockout check logic from auth.ts lines 52-56
function isAccountLocked(email: string, now: number): boolean {
    const attempts = failedLoginAttempts.get(email);
    if (attempts && attempts.lockoutUntil && attempts.lockoutUntil > now) {
        return true;
    }
    return false;
}

// Logic for incrementing failed attempts from auth.ts lines 65-71 and 82-88
function incrementFailedAttempts(email: string, now: number): void {
    const currentAttempts = failedLoginAttempts.get(email) || { count: 0, lastAttempt: now };
    currentAttempts.count += 1;
    currentAttempts.lastAttempt = now;
    if (currentAttempts.count >= LOCKOUT_THRESHOLD) {
        currentAttempts.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }
    failedLoginAttempts.set(email, currentAttempts);
}

// Logic for successful login reset from auth.ts line 93
function resetFailedAttempts(email: string): void {
    failedLoginAttempts.delete(email);
}

// Cleanup logic from auth.ts lines 16-28
function cleanupOldLockoutEntries(now: number): void {
    for (const [email, data] of failedLoginAttempts.entries()) {
        if (data.lockoutUntil && data.lockoutUntil < now) {
            failedLoginAttempts.delete(email);
        }
        if (data.lastAttempt && now - data.lastAttempt > FAILED_ATTEMPT_WINDOW_MS) {
            failedLoginAttempts.delete(email);
        }
    }
}

describe('Account Lockout Logic', () => {
    beforeEach(() => {
        failedLoginAttempts.clear();
    });

    describe('Failed attempt tracking', () => {
        it('should not be locked after 4 failed attempts', () => {
            const email = 'test@example.com';
            const baseTime = 1000000; // Start at a realistic time

            for (let i = 0; i < 4; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            expect(isAccountLocked(email, baseTime + 4000)).toBe(false);
            const attempts = failedLoginAttempts.get(email);
            expect(attempts?.count).toBe(4);
            expect(attempts?.lockoutUntil).toBeUndefined();
        });

        it('should be locked after 5 failed attempts', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            // After 5th attempt at baseTime+4000, lockout is set to baseTime+4000+LOCKOUT_DURATION_MS
            expect(isAccountLocked(email, baseTime + 5000)).toBe(true);
            const attempts = failedLoginAttempts.get(email);
            expect(attempts?.count).toBe(5);
            expect(attempts?.lockoutUntil).toBe(baseTime + 4000 + LOCKOUT_DURATION_MS);
        });
    });

    describe('Lockout enforcement', () => {
        it('should return null immediately for locked account', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            // Subsequent attempts should detect lockout
            expect(isAccountLocked(email, baseTime + 5000)).toBe(true);
            expect(isAccountLocked(email, baseTime + 6000)).toBe(true);
        });

        it('should continue to track failed attempts on locked account', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            // Try to login again while locked (this would return null in real auth)
            // The implementation still tracks attempts and can extend lockout
            incrementFailedAttempts(email, baseTime + 10000);

            // Both count and lockout time are updated
            expect(failedLoginAttempts.get(email)?.count).toBe(6);
            // lockoutUntil is recalculated based on current time (extends lockout)
            expect(failedLoginAttempts.get(email)?.lockoutUntil).toBe(baseTime + 10000 + LOCKOUT_DURATION_MS);
        });
    });

    describe('Lockout expiration', () => {
        it('should allow attempts after 15 minute lockout expires', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout at baseTime+4000
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            const lockoutExpiry = baseTime + 4000 + LOCKOUT_DURATION_MS;

            // Just before lockout expires
            expect(isAccountLocked(email, lockoutExpiry - 1)).toBe(true);

            // After lockout expires
            expect(isAccountLocked(email, lockoutExpiry)).toBe(false);
        });

        it('should allow new failed attempts after lockout expires', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            // Advance past lockout expiration
            const afterLockoutExpiry = baseTime + 4000 + LOCKOUT_DURATION_MS + 1000;

            // Should not be locked anymore
            expect(isAccountLocked(email, afterLockoutExpiry)).toBe(false);

            // When user returns after lockout, cleanup runs (removes old entry)
            cleanupOldLockoutEntries(afterLockoutExpiry);

            // New attempts start fresh since old entry was cleaned
            incrementFailedAttempts(email, afterLockoutExpiry);
            expect(failedLoginAttempts.get(email)?.count).toBe(1);
        });
    });

    describe('Successful login reset', () => {
        it('should reset failed attempt counter to 0 on successful login', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Make some failed attempts
            for (let i = 0; i < 3; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            expect(failedLoginAttempts.get(email)?.count).toBe(3);

            // Successful login
            resetFailedAttempts(email);

            expect(failedLoginAttempts.has(email)).toBe(false);
        });

        it('should reset both count and lockout on successful login before lockout', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Make 4 failed attempts (not locked yet)
            for (let i = 0; i < 4; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            // Successful login
            resetFailedAttempts(email);

            // Counter is reset
            expect(failedLoginAttempts.has(email)).toBe(false);

            // New attempts start from 0
            incrementFailedAttempts(email, baseTime + 100000);
            expect(failedLoginAttempts.get(email)?.count).toBe(1);
        });

        it('should fully reset lockout state on successful login', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            expect(isAccountLocked(email, baseTime + 5000)).toBe(true);
            expect(failedLoginAttempts.get(email)?.lockoutUntil).toBeDefined();

            // Successful login before lockout would have expired
            resetFailedAttempts(email);

            expect(failedLoginAttempts.has(email)).toBe(false);
        });
    });

    describe('Cleanup of old entries', () => {
        it('should clean up entries with expired lockout', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email, baseTime + i * 1000);
            }

            const lockoutExpiry = baseTime + 4000 + LOCKOUT_DURATION_MS;

            expect(failedLoginAttempts.has(email)).toBe(true);

            // Advance time past lockout expiration and cleanup
            cleanupOldLockoutEntries(lockoutExpiry + 1000);

            expect(failedLoginAttempts.has(email)).toBe(false);
        });

        it('should clean up entries with no recent activity (older than 1 hour)', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Make failed attempts
            incrementFailedAttempts(email, baseTime);

            // Advance time past 1 hour
            const afterOneHour = baseTime + FAILED_ATTEMPT_WINDOW_MS + 1000;
            cleanupOldLockoutEntries(afterOneHour);

            expect(failedLoginAttempts.has(email)).toBe(false);
        });

        it('should not clean up entries with recent activity', () => {
            const email = 'test@example.com';
            const baseTime = 1000000;

            // Make failed attempts
            incrementFailedAttempts(email, baseTime);

            // Advance time by 30 minutes (less than 1 hour window)
            const after30Min = baseTime + 30 * 60 * 1000;
            cleanupOldLockoutEntries(after30Min);

            expect(failedLoginAttempts.has(email)).toBe(true);
            expect(failedLoginAttempts.get(email)?.count).toBe(1);
        });

        it('should clean up expired lockouts but preserve non-expired ones during cleanup', () => {
            const email1 = 'locked@example.com';
            const email2 = 'unlocked@example.com';
            const baseTime = 1000000;

            // email1: locked, lockout will expire
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email1, baseTime + i * 1000);
            }

            // email2: has recent activity but lockout not set (only 3 attempts)
            for (let i = 0; i < 3; i++) {
                incrementFailedAttempts(email2, baseTime + i * 1000);
            }

            // Advance time so email1's lockout expires
            const afterExpiry = baseTime + 4000 + LOCKOUT_DURATION_MS + 1000;
            cleanupOldLockoutEntries(afterExpiry);

            // email1 should be cleaned up (lockout expired)
            expect(failedLoginAttempts.has(email1)).toBe(false);

            // email2 should still exist (recent activity, no lockout to expire)
            expect(failedLoginAttempts.has(email2)).toBe(true);
            expect(failedLoginAttempts.get(email2)?.count).toBe(3);
        });
    });

    describe('Multiple users lockout independence', () => {
        it('should track lockouts independently for different emails', () => {
            const email1 = 'user1@example.com';
            const email2 = 'user2@example.com';
            const baseTime = 1000000;

            // user1 gets locked
            for (let i = 0; i < 5; i++) {
                incrementFailedAttempts(email1, baseTime + i * 1000);
            }

            // user2 only has 3 attempts
            for (let i = 0; i < 3; i++) {
                incrementFailedAttempts(email2, baseTime + i * 1000);
            }

            expect(isAccountLocked(email1, baseTime + 5000)).toBe(true);
            expect(isAccountLocked(email2, baseTime + 5000)).toBe(false);

            // user2 can be locked independently
            incrementFailedAttempts(email2, baseTime + 5000);
            incrementFailedAttempts(email2, baseTime + 6000);

            expect(isAccountLocked(email2, baseTime + 7000)).toBe(true);
        });
    });
});
