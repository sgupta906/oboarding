/**
 * Screenshot capture script for all modal dialogs in OnboardingHub.
 * Captures "before" baseline screenshots for the slim-modals refactor.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS_DIR = '/workspaces/onboarding/.claude/features/slim-modals/screenshots';
const BASE_URL = 'http://localhost:5174';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function screenshot(page, name, description) {
  const path = join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`[OK] ${name}: ${description}`);
  return path;
}

async function waitAndClick(page, selector, options = {}) {
  await page.waitForSelector(selector, { timeout: 10000, ...options });
  await page.click(selector);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  console.log('=== Modal Screenshot Capture ===\n');

  // 1. Navigate to the app
  console.log('Navigating to app...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take a screenshot of the sign-in page first
  await screenshot(page, '00-signin-page', 'Sign-in page');

  // 2. Sign in as Manager (Quick Login)
  console.log('Signing in as Manager...');
  try {
    // Look for Quick Login / Dev login button
    const quickLoginBtn = await page.$('button:has-text("Quick Login")');
    const devLoginBtn = await page.$('button:has-text("Dev Login")');
    const managerBtn = await page.$('button:has-text("Manager")');

    if (quickLoginBtn) {
      await quickLoginBtn.click();
      await page.waitForTimeout(1000);
    } else if (devLoginBtn) {
      await devLoginBtn.click();
      await page.waitForTimeout(1000);
    } else if (managerBtn) {
      await managerBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Try to find any login-related buttons
      const allButtons = await page.$$('button');
      console.log('Available buttons:');
      for (const btn of allButtons) {
        const text = await btn.textContent();
        console.log(`  - "${text.trim()}"`);
      }
      // Click the first likely login button
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text.toLowerCase().includes('login') || text.toLowerCase().includes('sign') || text.toLowerCase().includes('manager')) {
          await btn.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
  } catch (e) {
    console.log('Login attempt error:', e.message);
  }

  await page.waitForTimeout(2000);
  await screenshot(page, '01-dashboard', 'Dashboard after login');

  // Check current page state
  const pageContent = await page.content();
  console.log('Current URL:', page.url());

  // 3. Navigate to Roles tab and capture Create Role modal
  console.log('\n--- Roles Tab ---');
  try {
    // Find and click Roles tab
    const rolesTab = await page.$('button:has-text("Roles")');
    if (rolesTab) {
      await rolesTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '02-roles-tab', 'Roles tab view');

      // Click "Add New Role" or similar button
      const addRoleBtn = await page.$('button:has-text("Add New Role")')
        || await page.$('button:has-text("New Role")')
        || await page.$('button:has-text("Create Role")')
        || await page.$('button:has-text("Add Role")');

      if (addRoleBtn) {
        await addRoleBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '03-create-role-modal', 'Create Role Modal');

        // Close the modal
        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else {
        console.log('  [SKIP] No "Add New Role" button found');
        // List available buttons in this section
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text.trim()) console.log(`    Button: "${text.trim()}"`);
        }
      }

      // Try to find an Edit button for an existing role
      const editBtn = await page.$('button:has-text("Edit")');
      const editIcon = await page.$('[aria-label*="Edit"]') || await page.$('[aria-label*="edit"]');

      if (editBtn) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '04-edit-role-modal', 'Edit Role Modal');

        // Close the modal
        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else if (editIcon) {
        await editIcon.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '04-edit-role-modal', 'Edit Role Modal');

        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else {
        console.log('  [SKIP] No existing roles to edit, will try to create one first');

        // Create a role first
        const addBtn = await page.$('button:has-text("Add New Role")')
          || await page.$('button:has-text("New Role")')
          || await page.$('button:has-text("Create Role")')
          || await page.$('button:has-text("Add Role")');

        if (addBtn) {
          await addBtn.click();
          await page.waitForTimeout(1000);

          // Fill in role name
          const nameInput = await page.$('#role-name') || await page.$('input[placeholder*="Senior"]') || await page.$('input[type="text"]');
          if (nameInput) {
            await nameInput.fill('Engineering');
            await page.waitForTimeout(500);

            // Submit the form
            const createBtn = await page.$('button:has-text("Create Role")');
            if (createBtn) {
              await createBtn.click();
              await page.waitForTimeout(2000);
            }
          }

          // Now try to edit it
          const editBtnAfter = await page.$('button:has-text("Edit")');
          if (editBtnAfter) {
            await editBtnAfter.click();
            await page.waitForTimeout(1000);
            await screenshot(page, '04-edit-role-modal', 'Edit Role Modal');

            const cancelBtn = await page.$('button:has-text("Cancel")');
            if (cancelBtn) await cancelBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    } else {
      console.log('  [SKIP] No Roles tab found');
    }
  } catch (e) {
    console.log('Roles error:', e.message);
  }

  // 4. Navigate to Users tab and capture Create User modal
  console.log('\n--- Users Tab ---');
  try {
    const usersTab = await page.$('button:has-text("Users")');
    if (usersTab) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '05-users-tab', 'Users tab view');

      // Click "+ New User" or similar button
      const addUserBtn = await page.$('button:has-text("New User")')
        || await page.$('button:has-text("Add User")')
        || await page.$('button:has-text("Create User")');

      if (addUserBtn) {
        await addUserBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '06-create-user-modal', 'Create User Modal');

        // Close the modal
        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else {
        console.log('  [SKIP] No "New User" button found');
      }

      // Try to find an Edit button for an existing user
      const editBtn = await page.$('button:has-text("Edit")');
      const editIcon = await page.$('[aria-label*="Edit user"]') || await page.$('[aria-label*="edit user"]');

      if (editBtn) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '07-edit-user-modal', 'Edit User Modal');

        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else if (editIcon) {
        await editIcon.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '07-edit-user-modal', 'Edit User Modal');

        const cancelBtn = await page.$('button:has-text("Cancel")');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);
      } else {
        console.log('  [NOTE] No existing users to edit');
      }
    } else {
      console.log('  [SKIP] No Users tab found');
    }
  } catch (e) {
    console.log('Users error:', e.message);
  }

  // 5. Navigate to Templates and capture Create Template modal
  console.log('\n--- Templates ---');
  try {
    // Templates might be a separate page via hash routing
    await page.goto(`${BASE_URL}/#/templates`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '08-templates-page', 'Templates page');

    // Click "Create Template" or similar
    const createTemplateBtn = await page.$('button:has-text("Create Template")')
      || await page.$('button:has-text("New Template")')
      || await page.$('button:has-text("Add Template")');

    if (createTemplateBtn) {
      await createTemplateBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '09-create-template-modal', 'Create Template Modal');

      // Close the modal
      const cancelBtn = await page.$('button:has-text("Cancel")');
      if (cancelBtn) await cancelBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('  [SKIP] No "Create Template" button found');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text.trim()) console.log(`    Button: "${text.trim()}"`);
      }
    }

    // Try to find an Edit button for an existing template
    const editBtn = await page.$('button:has-text("Edit")')
      || await page.$('[aria-label*="Edit template"]')
      || await page.$('[aria-label*="edit template"]');

    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '10-edit-template-modal', 'Edit Template Modal');

      const cancelBtn = await page.$('button:has-text("Cancel")');
      if (cancelBtn) await cancelBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('  [NOTE] No existing templates to edit');
    }
  } catch (e) {
    console.log('Templates error:', e.message);
  }

  // 6. Navigate back to dashboard and capture New Hire modal
  console.log('\n--- New Hire (CreateOnboardingModal) ---');
  try {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "+ New Hire" button
    const newHireBtn = await page.$('button:has-text("New Hire")')
      || await page.$('button:has-text("Add Hire")')
      || await page.$('button:has-text("New Employee")');

    if (newHireBtn) {
      await newHireBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '11-create-onboarding-modal', 'Create Onboarding (New Hire) Modal');

      const cancelBtn = await page.$('button:has-text("Cancel")');
      if (cancelBtn) await cancelBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('  [SKIP] No "New Hire" button found');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text.trim()) console.log(`    Button: "${text.trim()}"`);
      }
    }
  } catch (e) {
    console.log('New Hire error:', e.message);
  }

  console.log('\n=== Screenshot capture complete ===');
  await browser.close();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
