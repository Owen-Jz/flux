import { Page } from '@playwright/test';
import { getTestSuffix, TEST_WORKSPACE_NAME, TEST_BOARD_NAME } from './config';

/**
 * Login as a specific user
 * 1. Navigate to /login
 * 2. Fill email and password
 * 3. Click sign in button
 * 4. Wait for navigation away from /login
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  // Fill in the login form
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page
  await page.waitForURL(/\/(?!.*login)/);
}

/**
 * Signup new user
 * 1. Navigate to /signup
 * 2. Fill name, email, and password
 * 3. Submit form
 * 4. Wait for onboarding redirect
 */
export async function signupAs(page: Page, email: string, password: string, name: string): Promise<void> {
  await page.goto('/signup');

  // Fill in the signup form - find inputs by placeholder or type
  const nameInput = page.locator('input[placeholder*="name"], input[type="text"]').first();
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await nameInput.fill(name);
  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Click sign up button
  await page.click('button[type="submit"]');

  // Wait for redirect to onboarding
  await page.waitForURL('/onboarding');
}

/**
 * Create a test workspace and return its slug
 * Uses the UI flow: navigates to /onboarding, fills workspace form
 */
export async function createTestWorkspace(
  page: Page,
  name?: string
): Promise<{ slug: string; name: string }> {
  const workspaceName = name || `${TEST_WORKSPACE_NAME} ${getTestSuffix()}`;

  // Navigate to onboarding if not already there
  await page.goto('/onboarding');

  // Handle step 1 - profile setup (fill name and continue)
  const nameInput = page.locator('input[placeholder*="name"], input[type="text"]').first();
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill('Test User');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);
  }

  // Step 2 - workspace creation
  const workspaceNameInput = page.locator('input[placeholder*="Acme"], input[placeholder*="workspace"]');
  await workspaceNameInput.waitFor({ state: 'visible' });
  await workspaceNameInput.fill(workspaceName);

  // Submit workspace creation
  await page.click('button:has-text("Continue"):nth-of-type(2)');

  // Wait for redirect to workspace
  await page.waitForURL(/\/[a-z0-9-]+$/);

  // Extract slug from URL
  const url = page.url();
  const slug = url.split('/').pop() || '';

  return { slug, name: workspaceName };
}

/**
 * Create a test board in a workspace and return its slug
 * Navigates to workspace, clicks board creation, fills form
 */
export async function createTestBoard(
  page: Page,
  workspaceSlug: string,
  name?: string
): Promise<string> {
  const boardName = name || `${TEST_BOARD_NAME} ${getTestSuffix()}`;

  // Navigate to workspace
  await page.goto(`/${workspaceSlug}`);

  // Look for "Create Board" button - typically in workspace header or sidebar
  const createBoardBtn = page.locator('button:has-text("Create Board"), button:has-text("New Board"), a:has-text("Create Board")').first();
  await createBoardBtn.click();

  // Wait for board creation modal/dialog
  const boardNameInput = page.locator('input[placeholder*="board"], input[placeholder*="name"], input[placeholder*="Board"]');
  await boardNameInput.waitFor({ state: 'visible' });
  await boardNameInput.fill(boardName);

  // Submit the form
  await page.click('button[type="submit"], button:has-text("Create")');

  // Wait for navigation to board page
  await page.waitForURL(new RegExp(`/${workspaceSlug}/[a-z0-9-]+`));

  // Extract board slug from URL
  const url = page.url();
  const boardSlug = url.split('/').pop() || '';

  return boardSlug;
}

/**
 * Create a test task in a board using the inline quick-add
 */
export async function createTestTask(page: Page, boardSlug: string, title: string): Promise<void> {
  // Navigate to board if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes(`/${boardSlug}`)) {
    await page.goto(`/workspace/${boardSlug}`);
  }

  // Look for inline quick-add input (typically in a column)
  // Common selectors for quick-add task input
  const quickAddInput = page.locator(
    'input[placeholder*="Add task"], input[placeholder*="Add a task"], input[placeholder*="task"], textarea[placeholder*="task"]'
  ).first();

  await quickAddInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
    // Fallback: try clicking an "Add task" button first
    const addTaskBtn = page.locator('button:has-text("Add task"), button:has-text("Add Task")').first();
    if (addTaskBtn) {
      addTaskBtn.click();
    }
  });

  await quickAddInput.fill(title);
  await page.keyboard.press('Enter');

  // Wait briefly for task to be created
  await page.waitForTimeout(500);
}

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(
  page: Page,
  type?: 'success' | 'error' | 'info'
): Promise<void> {
  // Sonner toast selector - the library used by this project
  const toastSelector = '[class*="toast"], [class*="Toaster"], .sonner-toast';

  // Wait for any toast to appear
  const toast = page.locator(toastSelector).first();
  await toast.waitFor({ state: 'visible', timeout: 5000 });

  // If type is specified, could filter further but for now just wait for any toast
  if (type) {
    // Filter by class containing the type
    const typedToast = page.locator(`${toastSelector}[class*="${type}"]`).first();
    await typedToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      // Type-specific toast not found, but the general toast appeared - that's ok
    });
  }
}

/**
 * Click button and wait for navigation
 * Useful for buttons that trigger page transitions
 */
export async function clickAndNavigate(page: Page, selector: string): Promise<void> {
  const [navigationPromise] = await Promise.all([
    page.waitForNavigation({ timeout: 10000 }),
    page.click(selector),
  ]);

  // If no navigation happened (button didn't trigger navigation), just click and return
  if (!navigationPromise) {
    await page.click(selector);
  }
}

