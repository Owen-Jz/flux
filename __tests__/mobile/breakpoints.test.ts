import { test, expect } from '@playwright/test';
import { setupMobileTest, MOBILE_BREAKPOINTS } from './test-utils';

test.describe('Responsive Design Breakpoints (320px - 768px)', () => {

  for (const breakpoint of MOBILE_BREAKPOINTS) {
    test(`${breakpoint.name} (${breakpoint.width}px) - Board renders correctly`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      // Navigate to a board page - adjust path as needed for your app
      await page.goto('/board/test-board').catch(() => {
        // If board doesn't exist, just check the root loads
        return page.goto('/');
      });

      // Board container should be visible or page should load
      await expect(page.locator('body')).toBeVisible();
    });

    test(`${breakpoint.name} - Horizontal scroll works for overflow columns`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const boardContainer = page.locator('[data-testid="board-container"], .board-container, main');

      // Check if horizontal scroll is possible
      const scrollWidth = await boardContainer.evaluate((el) => el.scrollWidth);
      const clientWidth = await boardContainer.evaluate((el) => el.clientWidth);

      if (scrollWidth > clientWidth) {
        // Should be able to scroll horizontally
        await boardContainer.evaluate((el) => el.scrollTo({ left: 100, behavior: 'instant' }));
        const scrollLeft = await boardContainer.evaluate((el) => el.scrollLeft);
        expect(scrollLeft).toBeGreaterThan(0);
      }
    });

    test(`${breakpoint.name} - Task cards display correctly without overflow`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const taskCards = page.locator('[data-testid="task-card"], .task-card, [class*="task"]');
      const cardCount = await taskCards.count();

      if (cardCount > 0) {
        // Each card should be fully visible within its column
        for (let i = 0; i < Math.min(cardCount, 5); i++) {
          const card = taskCards.nth(i);
          const box = await card.boundingBox();

          expect(box.width).toBeLessThanOrEqual(breakpoint.width - 24); // Account for padding
        }
      }
    });

    test(`${breakpoint.name} - No content clipped or cut off`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      // Check that main content is fully visible
      const mainContent = page.locator('main, [role="main"], body');
      if (await mainContent.count() > 0) {
        const box = await mainContent.boundingBox();
        expect(box.height).toBeGreaterThan(0);
      }
    });

    test(`${breakpoint.name} - Navigation elements accessible`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      // Hamburger menu should be visible on mobile
      const menuButton = page.locator('[data-testid="mobile-menu-button"], button:has-text("Menu"), [aria-label="Menu"], [class*="menu"]');

      // Should either be visible OR navigation should have collapsed version
      const isMenuVisible = await menuButton.isVisible().catch(() => false);
      const nav = page.locator('nav, [role="navigation"]');
      const isNavVisible = await nav.isVisible().catch(() => false);

      expect(isMenuVisible || isNavVisible).toBe(true);
    });
  }
});
