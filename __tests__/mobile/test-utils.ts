import { Page, Locator, expect } from '@playwright/test';

export const MOBILE_BREAKPOINTS = [
  { width: 320, height: 568, name: 'iPhone SE' },
  { width: 375, height: 667, name: 'iPhone 12' },
  { width: 428, height: 926, name: 'iPhone 14 Pro' },
  { width: 768, height: 1024, name: 'iPad Mini' },
];

export async function setupMobileTest(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
}

export async function measureScrollPerformance(page: Page): Promise<{
  fps: number;
  jankPercentage: number;
  avgFrameTime: number;
}> {
  const metrics = await page.evaluate(() => {
    return new Promise<{
      fps: number;
      jankPercentage: number;
      avgFrameTime: number;
    }>((resolve) => {
      const frames: number[] = [];
      let lastTime = performance.now();
      let frameCount = 0;
      const maxFrames = 120;

      function measureFrame() {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        frames.push(delta);
        lastTime = currentTime;
        frameCount++;

        if (frameCount < maxFrames) {
          requestAnimationFrame(measureFrame);
        } else {
          const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
          const jankyFrames = frames.filter(f => f < 30).length;
          const jankPercentage = (jankyFrames / frames.length) * 100;
          resolve({
            fps: 1000 / avgFrameTime,
            jankPercentage,
            avgFrameTime
          });
        }
      }

      requestAnimationFrame(measureFrame);
    });
  });

  return metrics;
}

export async function simulateTouchScroll(page: Page, element: Locator, distance: number) {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - distance, { steps: 10 });
  await page.mouse.up();
}

export async function performDragDrop(page: Page, sourceSelector: string, targetSelector: string) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) throw new Error('Elements not found');

  // Touch-style drag: move to position, hold, move to target, release
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 20 });
  await page.mouse.up();
}

export async function checkWCAGContrast(page: Page): Promise<{ violations: any[] }> {
  // Use axe-core for accessibility testing
  const violations = await page.evaluate(() => {
    // @ts-ignore - axe-core injected globally
    if (typeof axe === 'undefined') {
      return [{ error: 'axe-core not loaded' }];
    }
    // @ts-ignore
    return axe.run();
  });
  return { violations: violations?.violations || [] };
}
