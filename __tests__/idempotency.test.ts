import { describe, it, expect } from 'vitest';
import { hashPayload, isValidUUID } from '../lib/idempotency';

describe('Idempotency Utilities', () => {
  describe('hashPayload', () => {
    it('should generate consistent hash for same payload', () => {
      const payload = { task: 'decompose', context: 'test' };

      const hash1 = hashPayload(payload);
      const hash2 = hashPayload(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should generate different hash for different payloads', () => {
      const payload1 = { task: 'decompose', context: 'test1' };
      const payload2 = { task: 'decompose', context: 'test2' };

      const hash1 = hashPayload(payload1);
      const hash2 = hashPayload(payload2);

      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string', () => {
      const payload = { data: 'sample' };
      const hash = hashPayload(payload);

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle nested objects consistently', () => {
      const payload = {
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' }
        ],
        metadata: { timestamp: 1234567890 }
      };

      const hash1 = hashPayload(payload);
      const hash2 = hashPayload(payload);

      expect(hash1).toBe(hash2);
    });

    it('should handle empty objects', () => {
      const hash = hashPayload({});

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should return true for another valid UUID v4', () => {
      const validUUID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should return false for invalid strings', () => {
      const invalidStrings = [
        'not-a-uuid',
        '12345',
        'abc-def-ghi-jkl-mno',
        '',
        '   ',
        '550e8400-e29b-41d4-a716-44665544000', // too short
        '550e8400-e29b-41d4-a716-4466554400000' // too long
      ];

      invalidStrings.forEach(str => {
        expect(isValidUUID(str)).toBe(false);
      });
    });

    it('should return false for UUID v1', () => {
      // UUID v1 has format: time_low-time_mid-time_hi_and_version-time_clock_seq-node
      // where the version is 1
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

      expect(isValidUUID(uuidV1)).toBe(false);
    });

    it('should return false for UUID v3', () => {
      // UUID v3 has version 3 in the third group
      const uuidV3 = '6ba7b810-9dad-31d1-80b4-00c04fd430c8';

      expect(isValidUUID(uuidV3)).toBe(false);
    });

    it('should return false for UUID v5', () => {
      // UUID v5 has version 5 in the third group
      const uuidV5 = '6ba7b810-9dad-51d1-80b4-00c04fd430c8';

      expect(isValidUUID(uuidV5)).toBe(false);
    });

    it('should be case insensitive', () => {
      const upperUUID = '550E8400-E29B-41D4-A716-446655440000';
      const lowerUUID = '550e8400-e29b-41d4-a716-446655440000';

      expect(isValidUUID(upperUUID)).toBe(true);
      expect(isValidUUID(lowerUUID)).toBe(true);
    });

    it('should return false for strings with invalid version in UUID', () => {
      // Version 0 is not valid
      const uuidV0 = '550e8400-e29b-01d4-a716-446655440000';

      expect(isValidUUID(uuidV0)).toBe(false);
    });
  });
});
