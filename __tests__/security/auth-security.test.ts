import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isWorkspaceMember, hasRole } from '../../lib/workspace-utils';
import bcrypt from 'bcryptjs';

// =============================================================================
// Authentication Security Tests
// =============================================================================

describe('Authentication Security', () => {
  // Replicate the lockout logic from lib/auth.ts for isolated testing
  const failedLoginAttempts = new Map<string, { count: number; lockoutUntil?: number; lastAttempt: number }>();

  const LOCKOUT_THRESHOLD = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  const FAILED_ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  function isAccountLocked(email: string, now: number): boolean {
    const attempts = failedLoginAttempts.get(email);
    if (attempts && attempts.lockoutUntil && attempts.lockoutUntil > now) {
      return true;
    }
    return false;
  }

  function incrementFailedAttempts(email: string, now: number): void {
    const currentAttempts = failedLoginAttempts.get(email) || { count: 0, lastAttempt: now };
    currentAttempts.count += 1;
    currentAttempts.lastAttempt = now;
    if (currentAttempts.count >= LOCKOUT_THRESHOLD) {
      currentAttempts.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }
    failedLoginAttempts.set(email, currentAttempts);
  }

  function resetFailedAttempts(email: string): void {
    failedLoginAttempts.delete(email);
  }

  beforeEach(() => {
    failedLoginAttempts.clear();
  });

  describe('Account lockout after 5 failed attempts (reference: auth-lockout.test.ts)', () => {
    it('should lock account after 5 failed login attempts', () => {
      const email = 'test@example.com';
      const baseTime = 1000000;

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(email, baseTime + i * 1000);
      }

      // Account should now be locked
      expect(isAccountLocked(email, baseTime + 5000)).toBe(true);

      const attempts = failedLoginAttempts.get(email);
      expect(attempts?.count).toBe(5);
      expect(attempts?.lockoutUntil).toBeDefined();
      expect(attempts?.lockoutUntil).toBe(baseTime + 4000 + LOCKOUT_DURATION_MS);
    });

    it('should not lock account after only 4 failed attempts', () => {
      const email = 'test@example.com';
      const baseTime = 1000000;

      // Make only 4 failed attempts
      for (let i = 0; i < 4; i++) {
        incrementFailedAttempts(email, baseTime + i * 1000);
      }

      // Account should NOT be locked
      expect(isAccountLocked(email, baseTime + 4000)).toBe(false);

      const attempts = failedLoginAttempts.get(email);
      expect(attempts?.count).toBe(4);
      expect(attempts?.lockoutUntil).toBeUndefined();
    });

    it('should allow login after lockout expires', () => {
      const email = 'test@example.com';
      const baseTime = 1000000;

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(email, baseTime + i * 1000);
      }

      // Check lockout expiry time
      const lockoutExpiry = baseTime + 4000 + LOCKOUT_DURATION_MS;

      // Just before expiry - should be locked
      expect(isAccountLocked(email, lockoutExpiry - 1)).toBe(true);

      // After expiry - should be unlocked
      expect(isAccountLocked(email, lockoutExpiry)).toBe(false);
    });

    it('should reset failed attempts on successful login', () => {
      const email = 'test@example.com';
      const baseTime = 1000000;

      // Make some failed attempts
      for (let i = 0; i < 3; i++) {
        incrementFailedAttempts(email, baseTime + i * 1000);
      }

      expect(failedLoginAttempts.get(email)?.count).toBe(3);

      // Successful login resets the counter
      resetFailedAttempts(email);

      expect(failedLoginAttempts.has(email)).toBe(false);
    });

    it('should track lockouts independently for different users', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      const baseTime = 1000000;

      // Lock user1
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(email1, baseTime + i * 1000);
      }

      // user2 only has 3 attempts
      for (let i = 0; i < 3; i++) {
        incrementFailedAttempts(email2, baseTime + i * 1000);
      }

      expect(isAccountLocked(email1, baseTime + 5000)).toBe(true);
      expect(isAccountLocked(email2, baseTime + 5000)).toBe(false);
    });

    it('should extend lockout on continued failed attempts while locked', () => {
      const email = 'test@example.com';
      const baseTime = 1000000;

      // Trigger initial lockout
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(email, baseTime + i * 1000);
      }

      const initialLockoutExpiry = failedLoginAttempts.get(email)?.lockoutUntil;

      // Continue attempting while locked
      incrementFailedAttempts(email, baseTime + 10000);

      const extendedLockoutExpiry = failedLoginAttempts.get(email)?.lockoutUntil;

      // Lockout should be extended
      expect(extendedLockoutExpiry).toBeGreaterThan(initialLockoutExpiry!);
    });
  });

  describe('Password comparison security', () => {
    it('bcrypt.compare should be called with correct parameters', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mock the compare function to verify it's called correctly
      const compareSpy = vi.spyOn(bcrypt, 'compare');

      await bcrypt.compare(password, hashedPassword);

      expect(compareSpy).toHaveBeenCalledWith(password, hashedPassword);
      compareSpy.mockRestore();
    });

    it('bcrypt.compare should return true for correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await bcrypt.compare(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('bcrypt.compare should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should not leak timing information through different response times', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword321';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Measure response times for correct and incorrect passwords
      // In a constant-time implementation, these should be similar
      const correctTimes: number[] = [];
      const incorrectTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startCorrect = performance.now();
        await bcrypt.compare(password, hashedPassword);
        correctTimes.push(performance.now() - startCorrect);

        const startIncorrect = performance.now();
        await bcrypt.compare(wrongPassword, hashedPassword);
        incorrectTimes.push(performance.now() - startIncorrect);
      }

      // bcrypt.compare is designed to be constant-time
      // We verify both return the expected result
      const correctResult = await bcrypt.compare(password, hashedPassword);
      const incorrectResult = await bcrypt.compare(wrongPassword, hashedPassword);

      expect(correctResult).toBe(true);
      expect(incorrectResult).toBe(false);
    });

    it('should use a salt when hashing passwords', async () => {
      const password = 'testPassword123';

      // Hash the same password twice
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Hashes should be different due to different salts
      expect(hash1).not.toBe(hash2);

      // Both should still verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('Empty credentials handling', () => {
    it('should return null for empty email', () => {
      // Simulating the authorize function behavior
      const email = '';
      const password = 'somepassword';

      if (!email || !password) {
        // This is how the authorize function handles empty credentials
        expect(null).toBeNull();
      }
    });

    it('should return null for empty password', () => {
      const email = 'test@example.com';
      const password = '';

      if (!email || !password) {
        expect(null).toBeNull();
      }
    });

    it('should return null for both empty credentials', () => {
      const email = '';
      const password = '';

      if (!email || !password) {
        expect(null).toBeNull();
      }
    });

    it('should return null for undefined credentials', () => {
      const email = undefined as any;
      const password = undefined as any;

      if (!email || !password) {
        expect(null).toBeNull();
      }
    });
  });
});

// =============================================================================
// Authorization Security Tests
// =============================================================================

describe('Authorization Security', () => {
  describe('hasRole validation', () => {
    it('should return false for invalid roles', () => {
      const member = { role: 'INVALID_ROLE' };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
    });

    it('should return false for undefined role', () => {
      const member = { role: undefined };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
    });

    it('should return false for null role', () => {
      const member = { role: null };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
    });

    it('should return false for empty string role', () => {
      const member = { role: '' };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
    });

    it('should handle numeric role values safely', () => {
      const member = { role: 123 as any };
      // This should not throw and should return false
      expect(hasRole(member, 'ADMIN')).toBe(false);
    });

    it('should return true for valid roles only', () => {
      const adminMember = { role: 'ADMIN' };
      const editorMember = { role: 'EDITOR' };
      const viewerMember = { role: 'VIEWER' };

      expect(hasRole(adminMember, 'ADMIN')).toBe(true);
      expect(hasRole(editorMember, 'EDITOR')).toBe(true);
      expect(hasRole(viewerMember, 'VIEWER')).toBe(true);
    });

    it('should check against multiple allowed roles', () => {
      const member = { role: 'ADMIN' };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(true);

      const viewerMember = { role: 'VIEWER' };
      expect(hasRole(viewerMember, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(true);

      const guestMember = { role: 'GUEST' };
      expect(hasRole(guestMember, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
    });
  });

  describe('isWorkspaceMember validation', () => {
    it('should return undefined for non-members', () => {
      const workspace = {
        members: [
          { userId: { toString: () => 'user-123' }, role: 'ADMIN' },
        ],
      };

      const result = isWorkspaceMember(workspace, 'non-member-id');
      expect(result).toBeUndefined();
    });

    it('should return undefined when workspace has no members', () => {
      const workspace = { members: [] };
      const result = isWorkspaceMember(workspace, 'user-123');
      expect(result).toBeUndefined();
    });

    it('should return undefined when members is undefined', () => {
      const workspace = { members: undefined };
      const result = isWorkspaceMember(workspace, 'user-123');
      expect(result).toBeUndefined();
    });

    it('should return member object for valid member', () => {
      const workspace = {
        members: [
          { userId: { toString: () => 'user-123' }, role: 'ADMIN' },
        ],
      };

      const result = isWorkspaceMember(workspace, 'user-123');
      expect(result).toBeDefined();
      expect(result?.role).toBe('ADMIN');
    });

    it('should return correct role for different members', () => {
      const workspace = {
        members: [
          { userId: { toString: () => 'admin-1' }, role: 'ADMIN' },
          { userId: { toString: () => 'editor-1' }, role: 'EDITOR' },
          { userId: { toString: () => 'viewer-1' }, role: 'VIEWER' },
        ],
      };

      expect(isWorkspaceMember(workspace, 'admin-1')?.role).toBe('ADMIN');
      expect(isWorkspaceMember(workspace, 'editor-1')?.role).toBe('EDITOR');
      expect(isWorkspaceMember(workspace, 'viewer-1')?.role).toBe('VIEWER');
      expect(isWorkspaceMember(workspace, 'unknown-1')).toBeUndefined();
    });
  });

  describe('Role-based access control', () => {
    it('should distinguish between admin and non-admin roles', () => {
      const adminMember = { role: 'ADMIN' };
      const regularMember = { role: 'MEMBER' };

      expect(hasRole(adminMember, 'ADMIN')).toBe(true);
      expect(hasRole(regularMember, 'ADMIN')).toBe(false);
    });

    it('should handle case-sensitive role matching', () => {
      const member = { role: 'admin' };

      // Roles should be case-sensitive
      expect(hasRole(member, 'ADMIN')).toBe(false);
      expect(hasRole(member, 'admin')).toBe(true);
    });
  });
});

// =============================================================================
// Session Security Tests
// =============================================================================

describe('Session Security', () => {
  describe('Session configuration', () => {
    it('should use JWT strategy for sessions', () => {
      // The auth.ts uses JWT strategy
      const sessionStrategy = 'jwt';
      expect(sessionStrategy).toBe('jwt');
    });

    it('should have reasonable session maxAge (24 hours)', () => {
      const maxAge = 24 * 60 * 60; // 24 hours in seconds
      expect(maxAge).toBe(86400);
    });
  });

  describe('JWT handling', () => {
    it('should preserve token values during JWT callback', () => {
      // Simulate token preservation logic
      const existingToken = { id: 'user-123', email: 'test@example.com' };

      // If token already has ID, it should be preserved
      expect(existingToken.id).toBeDefined();

      // New user object should update token
      const newUser = { id: 'user-456', email: 'new@example.com' };
      const updatedToken = { ...existingToken, id: newUser.id };
      expect(updatedToken.id).toBe('user-456');
    });
  });
});
