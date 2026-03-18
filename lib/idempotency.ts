import { createHash } from 'crypto';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { Types } from 'mongoose';

// TTL for idempotency keys (24 hours)
export const IDEMPOTENCY_TTL_HOURS = 24;

/**
 * Validates if a string is a valid UUID v4
 * @param str - The string to validate
 * @returns true if the string is a valid UUID v4
 */
export function isValidUUID(str: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(str);
}

/**
 * Generates a SHA-256 hash of a JSON payload
 * @param payload - The object to hash
 * @returns 64-character hex string
 */
export function hashPayload(payload: object): string {
  const jsonString = JSON.stringify(payload);
  return createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Gets a cached response for the given idempotency key
 * @param idempotencyKey - The idempotency key
 * @param userId - The user ID
 * @returns The cached response object or null if not found/expired
 */
export async function getCachedResponse(
  idempotencyKey: string,
  userId: string | Types.ObjectId
): Promise<object | null> {
  const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const cached = await IdempotencyKey.findOne({
    key: idempotencyKey,
    userId: userIdObj,
    expiresAt: { $gt: new Date() }
  });

  return cached?.response || null;
}

/**
 * Caches a response with the given idempotency key
 * Uses upsert to handle race conditions
 * @param idempotencyKey - The idempotency key
 * @param userId - The user ID
 * @param requestHash - Hash of the request for validation
 * @param response - The response to cache
 */
export async function cacheResponse(
  idempotencyKey: string,
  userId: string | Types.ObjectId,
  requestHash: string,
  response: object
): Promise<void> {
  const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

  await IdempotencyKey.findOneAndUpdate(
    { key: idempotencyKey, userId: userIdObj },
    {
      $set: {
        responseHash: requestHash,
        response: response,
        expiresAt: expiresAt
      }
    },
    { upsert: true }
  );
}
