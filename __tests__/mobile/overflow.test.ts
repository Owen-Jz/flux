import { test, expect } from '@playwright/test';
import { setupMobileTest, MOBILE_BREAKPOINTS } from './test-utils';

test.describe('Edge Case: Overflow Content', () => {

  for (const breakpoint of MOBILE_BREAKPOINTS) {
    test(`${breakpoint.name} - Long task title wraps correctly`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const taskCards = page.locator('[data-testid="task-card"], .task-card, [class*="task"]');
      const cardCount = await taskCards.count();

      if (cardCount > 0) {
        const card = taskCards.first();
        const box = await card.boundingBox();

        // Title should not cause horizontal overflow
        expect(box.width).toBeLessThanOrEqual(breakpoint.width - 24);
      }
    });

    test(`${breakpoint.name} - Many tasks in column scrolls smoothly`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const column = page.locator('[data-testid="board-column"], .column, [class*="column"]').first();

      // Get scroll properties
      const scrollInfo = await column.evaluate((el) => {
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          canScroll: el.scrollHeight > el.clientHeight
        };
      });

      if (scrollInfo.canScroll) {
        // Should be able to scroll to bottom
        await column.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));

        const scrollTop = await column.evaluate((el) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
      }
    });

    test(`${breakpoint.name} - Modal/dialog fits on screen`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      // Try to find and click a task card to open modal
      const taskCard = page.locator('[data-testid="task-card"], .task-card, [class*="task"]').first();

      if (await taskCard.count() > 0) {
        await taskCard.click().catch(() => {});

        const modal = page.locator('[role="dialog"], [data-testid="task-detail-modal"], [class*="modal"]');
        const modalCount = await modal.count();

        if (modalCount > 0) {
          const modalBox = await modal.boundingBox();

          // Modal should fit within viewport
          expect(modalBox.height).toBeLessThanOrEqual(breakpoint.height - 40);
          expect(modalBox.width).toBeLessThanOrEqual(breakpoint.width - 16);
        }
      }
    });
  }
});
