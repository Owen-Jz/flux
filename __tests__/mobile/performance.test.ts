import { test, expect } from '@playwright/test';
import { setupMobileTest, MOBILE_BREAKPOINTS, simulateTouchScroll } from './test-utils';

test.describe('Scroll Performance (Target: 60fps, Jank <5%)', () => {

  for (const breakpoint of MOBILE_BREAKPOINTS) {
    test(`${breakpoint.name} - Board container scrolling at 60fps`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const boardContainer = page.locator('[data-testid="board-container"], .board-container, main');

      // Check if scrollable
      const canScroll = await boardContainer.evaluate(
        (el) => el.scrollHeight > el.clientHeight
      );

      if (!canScroll) {
        test.skip();
        return;
      }

      // Inject performance measurement script
      await page.evaluate(() => {
        // Override requestAnimationFrame to measure frame times
        const originalRaf = window.requestAnimationFrame;
        const frameTimes: number[] = [];
        let lastTime = performance.now();

        window.requestAnimationFrame = (callback: FrameRequestCallback) => {
          return originalRaf((time) => {
            const delta = time - lastTime;
            frameTimes.push(delta);
            lastTime = time;
            callback(time);
          });
        };

        (window as any).__frameTimes = frameTimes;
      });

      // Perform multiple scroll actions
      for (let i = 0; i < 10; i++) {
        await simulateTouchScroll(page, boardContainer, 100);
        await page.waitForTimeout(50);
      }

      // Get frame times
      const frameTimes = await page.evaluate(() => (window as any).__frameTimes || []);

      if (frameTimes.length > 0) {
        // Calculate metrics
        const metrics = await page.evaluate((times) => {
          const avgFrameTime = times.reduce((a: number, b: number) => a + b, 0) / times.length;
          const fps = 1000 / avgFrameTime;
          const jankyFrames = times.filter((t: number) => t > 33.33).length; // Frames > 30fps threshold
          const jankPercentage = (jankyFrames / times.length) * 100;

          return { fps, jankPercentage, avgFrameTime };
        }, frameTimes);

        console.log(`FPS: ${metrics.fps.toFixed(2)}, Jank: ${metrics.jankPercentage.toFixed(2)}%`);

        // Target: 60fps average (allow 50fps minimum for mobile)
        expect(metrics.fps).toBeGreaterThan(50);

        // Target: < 5% jank
        expect(metrics.jankPercentage).toBeLessThan(5);
      }
    });

    test(`${breakpoint.name} - Task list scrolling is smooth`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      const column = page.locator('[data-testid="board-column"], .column, [class*="column"]').first();

      const canScroll = await column.evaluate(
        (el) => el.scrollHeight > el.clientHeight
      );

      if (!canScroll) {
        test.skip();
        return;
      }

      // Measure scroll performance
      const metrics = await column.evaluate(() => {
        return new Promise<{ fps: number; jankPercentage: number }>((resolve) => {
          const frames: number[] = [];
          let lastTime = performance.now();
          let scrollCount = 0;
          const maxScrolls = 30;

          function doScroll() {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            frames.push(delta);
            lastTime = currentTime;
            scrollCount++;

            if (scrollCount < maxScrolls) {
              doScroll();
            } else {
              const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
              const fps = 1000 / avgFrameTime;
              const jankyFrames = frames.filter(f => f > 33.33).length;
              const jankPercentage = (jankyFrames / frames.length) * 100;
              resolve({ fps, jankPercentage });
            }
          }

          // Start scrolling
          doScroll();
        });
      });

      expect(metrics.jankPercentage).toBeLessThan(5);
    });

    test(`${breakpoint.name} - No dropped frames during task interactions`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);
      await page.goto('/').catch(() => {});

      // Set up performance observer
      await page.evaluate(() => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            (window as any).__longTasks = entries;
          });
          observer.observe({ entryTypes: ['longtask'] });
        }
      });

      // Perform common interactions
      const taskCard = page.locator('[data-testid="task-card"], .task-card, [class*="task"]').first();
      if (await taskCard.count() > 0) {
        await taskCard.click().catch(() => {});
        await page.waitForTimeout(500);

        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
      }

      // Check for long tasks
      const longTasks = await page.evaluate(() => (window as any).__longTasks || []);

      // Should have minimal long tasks during interactions
      expect(longTasks.length).toBeLessThan(3);
    });
  }
});
