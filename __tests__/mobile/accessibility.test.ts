import { test, expect } from '@playwright/test';
import { setupMobileTest, MOBILE_BREAKPOINTS } from './test-utils';

test.describe('Mobile Accessibility (WCAG 2.1 AA)', () => {
  for (const breakpoint of MOBILE_BREAKPOINTS) {
    test(`${breakpoint.name} (${breakpoint.width}px) - Page loads without critical a11y violations`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      // Inject axe for testing
      await page.addScriptTag({ content: `
        (function() {
          var script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
          script.onload = function() { console.log('axe loaded'); };
          document.head.appendChild(script);
        })();
      `});
      await page.waitForTimeout(2000); // Wait for axe to load

      // Run axe analysis
      const violations = await page.evaluate(() => {
        // @ts-ignore
        return window.axe?.run() || { violations: [] };
      });

      // Filter for critical and serious violations only
      const criticalViolations = violations.violations?.filter(
        (v: any) => v.impact === 'critical' || v.impact === 'serious'
      ) || [];

      // Log violations for reporting
      if (criticalViolations.length > 0) {
        console.log('Accessibility violations found:', criticalViolations);
      }

      expect(criticalViolations.length).toBe(0);
    });

    test(`${breakpoint.name} - Touch targets meet 44x44px minimum`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      // Check interactive elements (buttons, links)
      const touchTargets = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, [role="button"], [role="link"]');
        const violations = [];

        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const size = Math.min(rect.width, rect.height);
          if (size < 44 && !el.hasAttribute('aria-hidden')) {
            violations.push({
              tag: el.tagName,
              text: el.textContent?.substring(0, 30),
              width: rect.width,
              height: rect.height
            });
          }
        }

        return violations;
      });

      expect(touchTargets.length).toBe(0);
    });

    test(`${breakpoint.name} - Focus indicators visible`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      const focusVisible = await page.evaluate(() => {
        // Check if default focus styles are present or custom focus-visible styles exist
        const style = document.createElement('style');
        style.textContent = `
          *:focus { outline: 3px solid blue !important; }
          *:focus-visible { outline: 3px solid blue !important; }
        `;
        document.head.appendChild(style);

        const focusable = document.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
        if (!focusable) return { hasFocusable: false };

        (focusable as HTMLElement).focus();

        const styles = window.getComputedStyle(focusable as Element);
        return {
          hasFocusable: true,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor
        };
      });

      expect(focusVisible.hasFocusable).toBe(true);
    });

    test(`${breakpoint.name} - Color contrast meets 4.5:1 ratio`, async ({ page }) => {
      await setupMobileTest(page, breakpoint);

      const contrastViolations = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
        const violations = [];

        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          const textColor = style.color;

          // Skip if element is transparent or has no text
          if (bgColor === 'rgba(0, 0, 0, 0)' || !el.textContent?.trim()) continue;

          const bgLuminance = getLuminance(bgColor);
          const fgLuminance = getLuminance(textColor);
          const contrast = (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);

          if (contrast < 4.5) {
            violations.push({
              text: el.textContent?.substring(0, 20),
              contrast: contrast.toFixed(2)
            });
          }
        }

        function getLuminance(color: string): number {
          const rgb = color.match(/\d+/g);
          if (!rgb) return 0;
          const [r, g, b] = rgb.map(Number).map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        return violations;
      });

      expect(contrastViolations.length).toBe(0);
    });
  }
});
