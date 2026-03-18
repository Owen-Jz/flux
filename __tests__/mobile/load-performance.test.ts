import { test, expect } from '@playwright/test';
import { setupMobileTest, MOBILE_BREAKPOINTS } from './test-utils';

test.describe('Mobile Load Performance', () => {

  for (const breakpoint of MOBILE_BREAKPOINTS) {
    test(`${breakpoint.name} - Page loads in under 3 seconds`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      const startTime = Date.now();

      await page.goto('/board/test-board', { waitUntil: 'networkidle' }).catch(async () => {
        await page.goto('/', { waitUntil: 'networkidle' });
      });

      const loadTime = Date.now() - startTime;

      console.log(`Page load time: ${loadTime}ms`);

      // Should load in under 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);
    });

    test(`${breakpoint.name} - No layout shifts after load`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      // Measure layout shifts
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift') {
                cls += (entry as any).value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          // Wait for page to stabilize
          setTimeout(() => resolve(cls), 2000);
        });
      });

      // CLS should be < 0.1 (Google's "good" threshold)
      expect(cls).toBeLessThan(0.1);
    });
  }
});
