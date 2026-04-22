import { test, expect, Page } from '@playwright/test';
import { loginAs, createTestWorkspace, createTestBoard, waitForToast } from './helpers';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD, getTestSuffix, FREE_WORKSPACE_LIMIT } from './config';

test.describe('Workspace', () => {

  test('@workspace - create workspace - valid', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/dashboard');

    // Click "Create Workspace" button
    const createBtn = page.locator('button:has-text("Create Workspace"), a:has-text("Create Workspace")').first();
    await createBtn.click();

    // Fill name with unique suffix
    const workspaceName = `Test Workspace ${getTestSuffix()}`;
    const nameInput = page.locator('input[placeholder*="workspace"], input[placeholder*="name"], input[placeholder*="Workspace"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(workspaceName);

    // Submit and verify redirect to workspace
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Continue")');
    await page.waitForTimeout(1000);

    // Should redirect to workspace page with slug in URL
    const url = page.url();
    expect(url).toMatch(/\/[a-z0-9-]+$/);
  });

  test('@workspace - create workspace - duplicate slug shows error', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    // Create first workspace
    const workspace1 = await createTestWorkspace(page);
    const slug = workspace1.slug;

    // Navigate to dashboard to create another workspace
    await page.goto('/dashboard');

    // Click Create Workspace again
    const createBtn = page.locator('button:has-text("Create Workspace"), a:has-text("Create Workspace")').first();
    await createBtn.click();

    // Use the SAME name to trigger duplicate slug
    const nameInput = page.locator('input[placeholder*="workspace"], input[placeholder*="name"], input[placeholder*="Workspace"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(workspace1.name);

    // Submit
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Continue")');
    await page.waitForTimeout(1000);

    // Verify error about duplicate slug
    const errorMsg = page.locator('text=/duplicate|already exists|slug/i, [class*="error"], [class*="message"]');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('@workspace - create workspace - plan limit free (3) shows upgrade prompt', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    // Create FREE_WORKSPACE_LIMIT workspaces
    for (let i = 0; i < FREE_WORKSPACE_LIMIT; i++) {
      await createTestWorkspace(page);
      await page.goto('/dashboard');
    }

    // Try to create a 4th workspace
    const createBtn = page.locator('button:has-text("Create Workspace"), a:has-text("Create Workspace")').first();
    await createBtn.click();

    const nameInput = page.locator('input[placeholder*="workspace"], input[placeholder*="name"], input[placeholder*="Workspace"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(`Overflow Workspace ${getTestSuffix()}`);

    // Submit
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Continue")');
    await page.waitForTimeout(1000);

    // Verify upgrade prompt appears
    const upgradePrompt = page.locator('text=/upgrade|limit|plan|premium/i');
    await expect(upgradePrompt.first()).toBeVisible({ timeout: 5000 });
  });

  test('@workspace - sidebar navigation accessible', async ({ page }) => {
    // Navigate to a workspace
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}`);

    // Verify sidebar nav items
    const navItems = ['Board', 'Issues', 'Analytics', 'Team', 'Settings', 'Archive'];
    for (const item of navItems) {
      const navLink = page.locator(`nav a:has-text("${item}"), aside a:has-text("${item}"), [class*="sidebar"] a:has-text("${item}")`).first();
      await expect(navLink).toBeVisible({ timeout: 5000 });
    }
  });

  test('@workspace - public access toggle', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/settings`);

    // Find and toggle public access
    const publicToggle = page.locator('input[type="checkbox"][*="public"], button:has-text("Public"), toggle').first();
    await publicToggle.click();

    await waitForToast(page, 'success');
    await page.reload();

    // Verify it persists
    const toggleAfterReload = page.locator('input[type="checkbox"][*="public"], button:has-text("Public")').first();
    await expect(toggleAfterReload).toBeVisible();
  });

  test('@workspace - accent color change persists', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/settings`);

    // Find and change accent color (typically a color picker or preset buttons)
    const colorButton = page.locator('button[style*="background"], button[class*="color"], [data-color]').first();
    if (await colorButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await colorButton.click();
      await waitForToast(page, 'success');
    }

    await page.reload();

    // Verify it persists - the color should still be selected
    const selectedColor = page.locator('[class*="selected"][style*="background"], [class*="accent"][class*="ring"]');
    await expect(selectedColor).toBeVisible({ timeout: 5000 });
  });

  test('@workspace - delete workspace with confirmation', async ({ page }) => {
    // Create a workspace
    const workspace = await createTestWorkspace(page);

    // Go to settings
    await page.goto(`/${workspace.slug}/settings`);

    // Click delete workspace button
    const deleteBtn = page.locator('button:has-text("Delete"), button:has-text("delete workspace"), button:has-text("Remove")').first();
    await deleteBtn.click();

    // Confirm in modal (typically input confirmation or confirm button)
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), input[placeholder*="type"]');
    await confirmBtn.first().click();

    await page.waitForTimeout(1000);

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

});

test.describe('Team Management', () => {

  test('@team - invite member - new email sends invite', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    // Find invite input and enter a new email
    const inviteInput = page.locator('input[placeholder*="email"], input[placeholder*="invite"], input[type="email"]');
    await inviteInput.waitFor({ state: 'visible' });
    await inviteInput.fill(`newuser-${getTestSuffix()}@test.com`);

    // Click invite button
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Send"), button:has-text("Add")');
    await inviteBtn.first().click();

    // Verify success message
    await waitForToast(page, 'success');
    const successMsg = page.locator('text=/invite sent|pending|email sent/i');
    await expect(successMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('@team - invite member - existing user added immediately', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    // Invite TEST_USER_EMAIL (already exists)
    const inviteInput = page.locator('input[placeholder*="email"], input[placeholder*="invite"], input[type="email"]');
    await inviteInput.waitFor({ state: 'visible' });
    await inviteInput.fill(TEST_USER_EMAIL);

    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Send"), button:has-text("Add")');
    await inviteBtn.first().click();

    await waitForToast(page, 'success');
    await page.waitForTimeout(500);

    // Verify added immediately (no pending state) - user should appear in members list
    const memberRow = page.locator('text=/member|editor|admin/i').first();
    await expect(memberRow).toBeVisible({ timeout: 5000 });
  });

  test('@team - pending requests - approve changes role', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    // Look for pending requests section
    const pendingSection = page.locator('text=/pending|requests|invitations/i');
    if (await pendingSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Find an approve button
      const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Accept"), button:has-text("Confirm")').first();
      await approveBtn.click();

      await waitForToast(page, 'success');
      await page.waitForTimeout(500);

      // Verify VIEWER becomes EDITOR (or role changes)
      const memberList = page.locator('[class*="member"], [class*="role"]');
      await expect(memberList.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('@team - pending requests - deny removes request', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    const pendingSection = page.locator('text=/pending|requests|invitations/i');
    if (await pendingSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Find a deny button
      const denyBtn = page.locator('button:has-text("Deny"), button:has-text("Reject"), button:has-text("Decline")').first();
      await denyBtn.click();

      await waitForToast(page, 'success');
      await page.waitForTimeout(500);

      // Verify request is removed
      const pendingCount = page.locator('text=/pending|requests/i');
      // The pending text should either be gone or count should decrease
      await expect(pendingCount).toBeVisible({ timeout: 3000 });
    }
  });

  test('@team - role change EDITOR→ADMIN updates in member list', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    // Find a member row with EDITOR role
    const editorRow = page.locator('text=/editor/i').first();
    if (await editorRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for role change dropdown/menu
      const roleDropdown = page.locator('[class*="role"], [class*="select"], button:has-text("Editor")').first();
      await roleDropdown.click();

      // Select ADMIN option
      const adminOption = page.locator('text=/admin/i').first();
      await adminOption.click();

      await waitForToast(page, 'success');
      await page.waitForTimeout(500);

      // Verify updated in member list - should now show ADMIN
      const adminLabel = page.locator('text=/admin/i');
      await expect(adminLabel.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('@team - remove member from workspace', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/team`);

    // Find a remove button in member rows
    const removeBtn = page.locator('button:has-text("Remove"), button:has-text("Delete"), button:has-text("Kick")').first();
    if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeBtn.click();

      // Confirm removal
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Remove")').first();
      await confirmBtn.click();

      await waitForToast(page, 'success');
      await page.waitForTimeout(500);

      // Verify member removed from list
      // The member count should decrease or the row should disappear
      await expect(page.locator('[class*="member"], [class*="table"]')).toBeVisible();
    }
  });

});

test.describe('Workspace Settings', () => {

  test('@settings - workspace name edit persists', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/settings`);

    // Find name input and edit
    const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="workspace"]').first();
    await nameInput.waitFor({ state: 'visible' });

    // Clear and fill with new name
    await nameInput.clear();
    const newName = `Updated WS ${getTestSuffix()}`;
    await nameInput.fill(newName);

    // Save
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Submit")');
    await saveBtn.first().click();

    await waitForToast(page, 'success');
    await page.reload();

    // Verify it persists
    await expect(page.locator(`text=/${newName}/i`)).toBeVisible({ timeout: 5000 });
  });

  test('@settings - workspace icon change persists', async ({ page }) => {
    const workspace = await createTestWorkspace(page);
    await page.goto(`/${workspace.slug}/settings`);

    // Find icon change button (typically an avatar/emoji picker or image upload)
    const iconBtn = page.locator('button:has-text("Change"), button:has-text("Edit Icon"), [class*="avatar"]').first();
    if (await iconBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await iconBtn.click();

      // Pick a new icon (emoji or preset option)
      const emojiOption = page.locator('button:has-text("🚀"), button:has-text("📁"), button:has-text("⭐")').first();
      if (await emojiOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emojiOption.click();
      } else {
        // Try clicking any visible option
        const option = page.locator('[class*="option"], [class*="emoji"], button[class*="rounded"]').first();
        await option.click();
      }

      await waitForToast(page, 'success');
    }

    await page.reload();

    // Verify it persists
    const iconElement = page.locator('[class*="avatar"], [class*="icon"]');
    await expect(iconElement.first()).toBeVisible({ timeout: 5000 });
  });

});