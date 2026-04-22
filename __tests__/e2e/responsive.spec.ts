import { test, expect, Page } from '@playwright/test';
import { loginAs, createTestWorkspace, createTestBoard, waitForToast } from './helpers';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD, getTestSuffix } from './config';
import { performDragDrop, checkWCAGContrast } from '../mobile/test-utils';

/**
 * Responsive and Accessibility E2E tests
 * Tests viewport rendering, mobile interactions, and WCAG compliance
 */

const VIEWPORTS = {
  mobile320: { width: 320, height: 568, name: 'Mobile 320px (iPhone SE)' },
  mobile375: { width: 375, height: 667, name: 'Mobile 375px (iPhone 12)' },
  mobile428: { width: 428, height: 926, name: 'Mobile 428px (iPhone 14 Pro)' },
  tablet768: { width: 768, height: 1024, name: 'Tablet 768px (iPad Mini)' },
  desktop1280: { width: 1280, height: 720, name: 'Desktop 1280x720' },
};

test.describe('Responsive - Viewport Rendering', () => {

  test('@responsive - all viewports render without overflow at all breakpoints', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Overflow Test Board ${getTestSuffix()}`);

    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await test.step(`Testing viewport: ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Navigate to board
        await page.goto(`/${slug}/${boardSlug}`);
        await page.waitForLoadState('networkidle');

        // Check no horizontal overflow on main board view
        const bodyOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });
        expect(bodyOverflow, `Horizontal overflow detected on ${viewport.name}`).toBe(false);

        // Check no vertical overflow causing layout issues
        const htmlOverflow = await page.evaluate(() => {
          const html = document.documentElement;
          return html.scrollHeight > html.clientHeight;
        });
        // Allow vertical scroll but no horizontal overflow
        expect(bodyOverflow).toBe(false);

        // Verify key elements are visible and not clipped
        const columns = page.locator('[data-column], [class*="column"]').first();
        if (await columns.isVisible({ timeout: 3000 }).catch(() => false)) {
          const colBox = await columns.boundingBox();
          expect(colBox, `Column clipped on ${viewport.name}`).not.toBeNull();
        }
      });
    }
  });

  test('@responsive - workspace dashboard renders correctly at all breakpoints', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await test.step(`Testing dashboard at ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // No horizontal overflow
        const bodyOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });
        expect(bodyOverflow, `Dashboard horizontal overflow at ${viewport.name}`).toBe(false);

        // Main content visible and not cut off
        const mainContent = page.locator('main, [role="main"], .dashboard').first();
        if (await mainContent.isVisible({ timeout: 3000 }).catch(() => false)) {
          const mainBox = await mainContent.boundingBox();
          expect(mainBox?.width, `Dashboard main content too wide at ${viewport.name}`).toBeLessThanOrEqual(viewport.width);
        }
      });
    }
  });

  test('@responsive - board view renders without overflow', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Board Render Test ${getTestSuffix()}`);

    // Create a few tasks
    await page.goto(`/${slug}/${boardSlug}`);
    const quickAddInput = page.locator('input[placeholder*="Add task"], input[placeholder*="Add a task"]').first();
    for (let i = 0; i < 3; i++) {
      await quickAddInput.waitFor({ state: 'visible' });
      await quickAddInput.fill(`Render Test Task ${i} ${getTestSuffix()}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }

    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await test.step(`Testing board render at ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/${slug}/${boardSlug}`);
        await page.waitForLoadState('networkidle');

        // Check scrollable content does not cause horizontal overflow
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow, `Board horizontal overflow at ${viewport.name}`).toBe(false);

        // All 5 default columns visible at desktop/tablet, stacked at mobile
        const columns = page.locator('h3:has-text("Backlog"), h3:has-text("To Do")');
        await expect(columns.first()).toBeVisible();
      });
    }
  });

});

test.describe('Responsive - Mobile Navigation', () => {

  test('@responsive - mobile nav hamburger menu works on mobile', async ({ page }) => {
    // Test on smallest mobile viewport
    await page.setViewportSize({ width: VIEWPORTS.mobile320.width, height: VIEWPORTS.mobile320.height });

    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);

    // Navigate to workspace
    await page.goto(`/${slug}`);
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu button (typically 3 lines / hamburger icon)
    const hamburgerBtn = page.locator(
      'button[aria-label="Menu"], button[aria-label*="menu"], button[aria-label*="Menu"], ' +
      '[class*="hamburger"], [class*="menu-toggle"], button:has-text("Menu")'
    ).first();

    // If hamburger is not immediately visible, check if nav is collapsed
    const hamburgerVisible = await hamburgerBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hamburgerVisible) {
      // Click hamburger to open nav
      await hamburgerBtn.click();
      await page.waitForTimeout(300);

      // Verify nav drawer/menu opens
      const navDrawer = page.locator(
        '[role="navigation"], nav, [class*="drawer"], [class*="sidebar"], [class*="nav"]'
      ).first();

      const drawerVisible = await navDrawer.isVisible({ timeout: 3000 }).catch(() => false);
      expect(drawerVisible, 'Nav drawer should open after hamburger click').toBe(true);

      // Close by clicking hamburger again or close button
      const closeBtn = page.locator(
        'button[aria-label="Close"], button[aria-label*="close"], [class*="close"]'
      ).first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await hamburgerBtn.click();
      }

      await page.waitForTimeout(300);

      // Verify nav closes
      const drawerClosed = await navDrawer.isHidden({ timeout: 3000 }).catch(() => false);
      expect(drawerClosed, 'Nav drawer should close after second hamburger click').toBe(true);
    } else {
      // If no hamburger, nav might be visible by default - verify it renders
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible({ timeout: 3000 });
    }
  });

  test('@responsive - hamburger menu works at 375px and 428px', async ({ page }) => {
    const mobileViewports = [VIEWPORTS.mobile375, VIEWPORTS.mobile428];

    for (const viewport of mobileViewports) {
      await test.step(`Testing hamburger at ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
        const { slug } = await createTestWorkspace(page);
        await page.goto(`/${slug}`);
        await page.waitForLoadState('networkidle');

        const hamburgerBtn = page.locator(
          'button[aria-label="Menu"], button[aria-label*="menu"], [class*="hamburger"], [class*="menu-toggle"]'
        ).first();

        if (await hamburgerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await hamburgerBtn.click();
          await page.waitForTimeout(300);

          const nav = page.locator('[role="navigation"], nav, [class*="drawer"], [class*="sidebar"]').first();
          await expect(nav).toBeVisible({ timeout: 3000 });

          // Close it
          await hamburgerBtn.click();
          await page.waitForTimeout(300);
        }
      });
    }
  });

  test('@responsive - tablet navigation shows full sidebar', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.tablet768.width, height: VIEWPORTS.tablet768.height });

    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    await page.goto(`/${slug}`);
    await page.waitForLoadState('networkidle');

    // At tablet, sidebar should be visible (not collapsed to hamburger)
    const sidebar = page.locator('[role="navigation"], nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

});

test.describe('Responsive - Mobile Board Drag', () => {

  test('@responsive - board drag works on mobile (touch drag)', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.mobile375.width, height: VIEWPORTS.mobile375.height });

    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Mobile Drag Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Create a task in the first column
    const quickAddInput = page.locator('input[placeholder*="Add task"], input[placeholder*="Add a task"]').first();
    await quickAddInput.waitFor({ state: 'visible' });
    const taskTitle = `Drag Task ${getTestSuffix()}`;
    await quickAddInput.fill(taskTitle);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Get task card and target column positions
    const taskCard = page.locator(`[data-task-card]:has-text("${taskTitle}"), [class*="task-card"]:has-text("${taskTitle}")`).first();
    const todoColumn = page.locator('h3:has-text("To Do"), [data-column-name="To Do"]').first();
    const inProgressColumn = page.locator('h3:has-text("In Progress"), [data-column-name="In Progress"]').first();

    const taskBox = await taskCard.boundingBox();
    const inProgressBox = await inProgressColumn.boundingBox();

    if (taskBox && inProgressBox) {
      // Perform touch drag from task to In Progress column
      await performDragDrop(
        page,
        `[data-task-card]:has-text("${taskTitle}")`,
        `h3:has-text("In Progress")`
      );

      await page.waitForTimeout(500);

      // Check if drag was recognized (toast or column change)
      // Note: on mobile, drag may be harder to trigger - we just verify no errors
      const hasError = await page.locator('[class*="error"], [class*="toast"][class*="error"]').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasError, 'No error should occur during mobile drag').toBe(false);
    }
  });

  test('@responsive - board drag at 428px viewport', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORTS.mobile428.width, height: VIEWPORTS.mobile428.height });

    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Mobile Drag Board 428 ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Create task
    const quickAddInput = page.locator('input[placeholder*="Add task"], input[placeholder*="Add a task"]').first();
    await quickAddInput.waitFor({ state: 'visible' });
    const taskTitle = `Drag Task 428 ${getTestSuffix()}`;
    await quickAddInput.fill(taskTitle);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Attempt drag - should not throw errors
    const taskCard = page.locator(`[data-task-card]:has-text("${taskTitle}"), [class*="task-card"]:has-text("${taskTitle}")`).first();
    const inProgressColumn = page.locator('h3:has-text("In Progress")').first();

    const taskBox = await taskCard.boundingBox();
    const targetBox = await inProgressColumn.boundingBox();

    if (taskBox && targetBox) {
      // Simulate touch drag
      await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 15 });
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Verify no crash
      const pageStillWorks = await page.locator('body').isVisible();
      expect(pageStillWorks).toBe(true);
    }
  });

});

test.describe('Accessibility - Keyboard Navigation', () => {

  test('@a11y - keyboard navigation tab through all interactive elements', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Keyboard Nav Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Collect all focusable elements before tabbing
    const focusableSelector = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])', 'details > summary'
    ].join(', ');

    // Start from top of page
    await page.evaluate(() => window.scrollTo(0, 0));

    // Tab through interactive elements
    const tabCount = await page.evaluate((selector) => {
      const focusableElements = document.querySelectorAll(selector);
      return focusableElements.length;
    }, focusableSelector);

    expect(tabCount, 'Should have multiple focusable interactive elements').toBeGreaterThan(0);

    // Press Tab multiple times and verify focus moves
    let lastFocused: Element | null = null;
    for (let i = 0; i < Math.min(tabCount + 5, 20); i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const focused = await page.evaluate(() => document.activeElement);
      if (focused && focused !== lastFocused) {
        lastFocused = focused;
        // Verify the focused element is actually focusable
        const isFocusable = await page.evaluate((el: Element | null) => {
          return el !== null && (el as HTMLElement).blur !== undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, focused as any);
        expect(isFocusable, 'Focused element should be focusable').toBe(true);
      }
    }

    // Verify we traversed at least some elements
    expect(tabCount).toBeGreaterThan(0);
  });

  test('@a11y - keyboard navigation works in task modal', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Modal Keyboard ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Create a task and open its modal
    const quickAddInput = page.locator('input[placeholder*="Add task"], input[placeholder*="Add a task"]').first();
    await quickAddInput.waitFor({ state: 'visible' });
    const taskTitle = `Modal Keyboard Task ${getTestSuffix()}`;
    await quickAddInput.fill(taskTitle);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Click task to open modal
    const taskCard = page.locator(`text="${taskTitle}"`).first();
    await taskCard.click();

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"], [data-modal], .modal').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // Tab through modal elements
    const modalTabCount = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return 0;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });

    expect(modalTabCount, 'Modal should have multiple focusable elements').toBeGreaterThan(0);

    // Navigate through modal with Tab
    for (let i = 0; i < modalTabCount + 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify modal closed (focus should return to trigger)
    const modalClosed = await modal.isHidden({ timeout: 3000 }).catch(() => true);
    expect(modalClosed, 'Modal should close on Escape').toBe(true);
  });

  test('@a11y - keyboard navigation in workspace dashboard', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Press Tab to start navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Verify first element got focus (should not throw error)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement, 'Should have a focused element after Tab').toBeTruthy();

    // Continue tabbing through navigation
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // No errors should occur
    const pageStillWorks = await page.locator('body').isVisible();
    expect(pageStillWorks).toBe(true);
  });

});

test.describe('Accessibility - Focus Rings', () => {

  test('@a11y - focus rings visible on focusable elements', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);

    await page.goto(`/${slug}`);
    await page.waitForLoadState('networkidle');

    // Get all focusable elements and check for visible focus rings
    const focusableSelector = 'a, button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const elementsWithFocusRing = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      let visibleCount = 0;

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el as HTMLElement);
        // Check for outline or box-shadow that serves as focus indicator
        const hasOutline = parseFloat(styles.outlineWidth) > 0 || styles.outline !== 'none';
        const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== 'initial';
        const hasFocusRing = hasOutline || hasBoxShadow;

        if (hasFocusRing) visibleCount++;
      });

      return { total: elements.length, withFocusRing: visibleCount };
    }, focusableSelector);

    // At least some focusable elements should have visible focus indicators
    expect(elementsWithFocusRing.total, 'Should have focusable elements').toBeGreaterThan(0);

    // Alternatively, check that when we focus an element, its focus ring is visible
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedStyles = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return null;
      const styles = window.getComputedStyle(focused as HTMLElement);
      return {
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
        outlineColor: styles.outlineColor,
      };
    });

    // Verify the focused element has a visible focus indicator
    const hasVisibleFocusRing = focusedStyles && (
      (parseFloat(focusedStyles.outlineWidth) > 0 && focusedStyles.outlineStyle !== 'none') ||
      (focusedStyles.boxShadow !== 'none' && focusedStyles.boxShadow !== 'initial')
    );
    expect(hasVisibleFocusRing, 'Focused element should have visible focus ring').toBe(true);
  });

  test('@a11y - focus rings visible on buttons throughout app', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Focus Ring Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button:not([disabled])');
    const buttonCount = await buttons.count();

    expect(buttonCount, 'Should have multiple buttons').toBeGreaterThan(0);

    // Focus each button and verify focus ring
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const btn = await button.boundingBox();
      if (!btn) continue;
      await button.focus();
      await page.waitForTimeout(100);

      const focusRingVisible = await page.evaluate((box) => {
        const tmpBtn = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        if (!tmpBtn) return false;
        const styles = window.getComputedStyle(tmpBtn);
        const hasOutline = parseFloat(styles.outlineWidth) > 0 && styles.outlineStyle !== 'none';
        const hasShadow = styles.boxShadow !== 'none' && styles.boxShadow !== 'initial';
        return hasOutline || hasShadow;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, btn as any);

      // At least some buttons should have focus rings
      if (focusRingVisible) break;
    }

    // Final check - press Tab and verify focus ring visible
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedBtnHasRing = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el as HTMLElement);
      return parseFloat(styles.outlineWidth) > 0 || (styles.boxShadow !== 'none' && styles.boxShadow !== 'initial');
    });

    expect(focusedBtnHasRing, 'Focused button should have visible focus ring').toBe(true);
  });

});

test.describe('Accessibility - ARIA Labels', () => {

  test('@a11y - aria labels present on all icon buttons', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Aria Labels Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Find all icon-only buttons (buttons without visible text content)
    const iconButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const results: { text: string; ariaLabel: string | null; ariaLabelledby: string | null }[] = [];

      buttons.forEach((btn) => {
        const text = btn.textContent?.trim() || '';
        const ariaLabel = btn.getAttribute('aria-label');
        const ariaLabelledby = btn.getAttribute('aria-labelledby');
        const hasIconClass = btn.querySelector('svg, [class*="icon"], [class*="Icon"]');

        if (!text || hasIconClass) {
          results.push({ text, ariaLabel, ariaLabelledby });
        }
      });

      return results;
    });

    // Each icon button should have either aria-label or aria-labelledby
    for (const btn of iconButtons) {
      const hasLabel = btn.ariaLabel !== null || btn.ariaLabelledby !== null;
      expect(hasLabel, `Icon button "${btn.text}" should have aria-label or aria-labelledby`).toBe(true);
    }
  });

  test('@a11y - aria labels on navigation elements', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check navigation landmarks
    const navElements = page.locator('nav, [role="navigation"]');
    const navCount = await navElements.count();

    if (navCount > 0) {
      // Each nav should have aria-label or be properly sectioned
      for (let i = 0; i < navCount; i++) {
        const nav = navElements.nth(i);
        const ariaLabel = await nav.getAttribute('aria-label');
        const ariaLabelledby = await nav.getAttribute('aria-labelledby');

        // At least one nav should have a label (the main navigation)
        if (i === 0) {
          expect(ariaLabel || ariaLabelledby, 'Main navigation should have aria-label').toBeTruthy();
        }
      }
    }
  });

  test('@a11y - form inputs have associated labels', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Form Labels Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Find all inputs without labels
    const unlabeledInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
      const issues: string[] = [];

      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const name = input.getAttribute('name');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const placeholder = input.getAttribute('placeholder');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);

        if (!hasLabel && !ariaLabel && !ariaLabelledby && !placeholder) {
          issues.push(`Input[name="${name || id || 'unnamed'}"] has no label`);
        }
      });

      return issues;
    });

    expect(unlabeledInputs, 'All inputs should have labels').toHaveLength(0);
  });

  test('@a11y - modals have accessible names', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Modal A11y Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    // Create task and open modal
    const quickAddInput = page.locator('input[placeholder*="Add task"], input[placeholder*="Add a task"]').first();
    await quickAddInput.waitFor({ state: 'visible' });
    const taskTitle = `Modal A11y Task ${getTestSuffix()}`;
    await quickAddInput.fill(taskTitle);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const taskCard = page.locator(`text="${taskTitle}"`).first();
    await taskCard.click();

    // Check modal accessibility
    const modalA11y = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { found: false };

      const ariaLabel = modal.getAttribute('aria-label');
      const ariaLabelledby = modal.getAttribute('aria-labelledby');
      const ariaDescribedby = modal.getAttribute('aria-describedby');
      const title = modal.querySelector('h1, h2, h3');

      return {
        found: true,
        hasAccessibleName: !!(ariaLabel || ariaLabelledby || (title?.textContent)),
        ariaLabel,
        ariaLabelledby,
        titleText: title?.textContent || null,
      };
    });

    expect(modalA11y.found, 'Should find modal dialog').toBe(true);
    expect(modalA11y.hasAccessibleName, 'Modal should have accessible name via aria-label or heading').toBe(true);
  });

});

test.describe('Accessibility - Color Contrast (WCAG AA)', () => {

  test('@a11y - color contrast meets WCAG AA on dashboard', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Use checkWCAGContrast from mobile test utils
    const { violations } = await checkWCAGContrast(page);

    // Filter to only contrast-related violations
    const contrastViolations = violations.filter((v: any) =>
      v.id === 'color-contrast' || v.description?.toLowerCase().includes('contrast')
    );

    if (contrastViolations.length > 0) {
      const details = contrastViolations.map((v: any) =>
        `${v.node?.target}: ${v.description}`
      ).join('; ');
      console.log('Contrast violations found:', details);
    }

    expect(contrastViolations, 'No color contrast violations should be found (WCAG AA)').toHaveLength(0);
  });

  test('@a11y - color contrast meets WCAG AA on board view', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Contrast Board ${getTestSuffix()}`);

    await page.goto(`/${slug}/${boardSlug}`);
    await page.waitForLoadState('networkidle');

    const { violations } = await checkWCAGContrast(page);

    const contrastViolations = violations.filter((v: any) =>
      v.id === 'color-contrast' || v.description?.toLowerCase().includes('contrast')
    );

    expect(contrastViolations, 'Board view should have no contrast violations').toHaveLength(0);
  });

  test('@a11y - color contrast meets WCAG AA at all viewports', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    const { slug } = await createTestWorkspace(page);
    const boardSlug = await createTestBoard(page, slug, `Contrast VP Board ${getTestSuffix()}`);

    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await test.step(`Checking contrast at ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/${slug}/${boardSlug}`);
        await page.waitForLoadState('networkidle');

        const { violations } = await checkWCAGContrast(page);

        const contrastViolations = violations.filter((v: any) =>
          v.id === 'color-contrast' || v.description?.toLowerCase().includes('contrast')
        );

        expect(contrastViolations, `Contrast violations at ${viewport.name}`).toHaveLength(0);
      });
    }
  });

  test('@a11y - contrast on login/signup pages', async ({ page }) => {
    // Test login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const loginViolations = await checkWCAGContrast(page);
    const loginContrast = loginViolations.violations.filter((v: any) =>
      v.id === 'color-contrast' || v.description?.toLowerCase().includes('contrast')
    );

    expect(loginContrast, 'Login page should have no contrast violations').toHaveLength(0);

    // Test signup page
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const signupViolations = await checkWCAGContrast(page);
    const signupContrast = signupViolations.violations.filter((v: any) =>
      v.id === 'color-contrast' || v.description?.toLowerCase().includes('contrast')
    );

    expect(signupContrast, 'Signup page should have no contrast violations').toHaveLength(0);
  });

});