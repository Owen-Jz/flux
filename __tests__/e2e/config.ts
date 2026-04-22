/**
 * Test configuration constants for E2E tests
 * All values support environment variable overrides with fallback defaults
 */

export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

export const TEST_WORKSPACE_NAME = process.env.TEST_WORKSPACE_NAME || 'Test Workspace';
export const TEST_BOARD_NAME = process.env.TEST_BOARD_NAME || 'Test Board';

/**
 * Workspace plan limits
 */
export const FREE_WORKSPACE_LIMIT = 3;

/**
 * Generate a unique suffix for test isolation
 * Used to avoid name collisions in parallel tests
 */
export function getTestSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
