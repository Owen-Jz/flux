import { test as base, Page } from '@playwright/test';
import { loginAs } from './helpers';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD } from './config';

/**
 * Fixture for a logged-in regular user page
 * Automatically logs in before each test and waits for navigation away from /login
 */
export const authenticatedPage = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.waitForURL(/^(?!.*\/login)/);
    await use(page);
  },
});

/**
 * Fixture for admin page (logged in as admin)
 * Automatically logs in as admin and navigates to /admin
 */
export const adminPage = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    await use(page);
  },
});
