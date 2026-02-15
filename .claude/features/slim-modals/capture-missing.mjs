/**
 * Retry capture for Edit Role modal and Edit User modal
 */
import { chromium } from 'playwright';
import { join } from 'path';

const SCREENSHOTS_DIR = '/workspaces/onboarding/.claude/features/slim-modals/screenshots';
const BASE_URL = 'http://localhost:5174';

async function screenshot(page, name, description) {
  const path = join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`[OK] ${name}: ${description}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Navigate and sign in
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Sign in
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && (text.toLowerCase().includes('quick login') || text.toLowerCase().includes('manager') || text.toLowerCase().includes('login'))) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(2000);

  // Go to Roles tab
  console.log('--- Capturing Edit Role Modal ---');
  const rolesTab = await page.$('button:has-text("Roles")');
  if (rolesTab) {
    await rolesTab.click();
    await page.waitForTimeout(1500);

    // Look for existing roles and their edit buttons
    // Try clicking on pencil icon or edit button within role cards
    const allEditBtns = await page.$$('[aria-label*="dit"]');
    console.log(`Found ${allEditBtns.length} elements with "dit" in aria-label`);
    for (const btn of allEditBtns) {
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`  aria-label: "${ariaLabel}"`);
    }

    // Also look for edit icons (pencil icons within the role list)
    const pencilIcons = await page.$$('svg.lucide-pencil, svg.lucide-edit, svg.lucide-pen');
    console.log(`Found ${pencilIcons.length} pencil/edit icons`);

    // Try a broader search for any clickable elements near role names
    const roleCards = await page.$$('[class*="role"], [data-testid*="role"]');
    console.log(`Found ${roleCards.length} role-related elements`);

    // Take a more detailed screenshot of the roles tab to see what's there
    await screenshot(page, '02b-roles-tab-detail', 'Roles tab detail view');

    // Try to find Edit buttons that might be hidden/revealed on hover
    // Let's search for all buttons that have edit-like text
    const allButtons = await page.$$('button');
    let foundEdit = false;
    for (const btn of allButtons) {
      const text = (await btn.textContent()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      if (text.toLowerCase().includes('edit') || (ariaLabel && ariaLabel.toLowerCase().includes('edit'))) {
        console.log(`  Edit button found: text="${text}", aria-label="${ariaLabel}"`);
        try {
          // Scroll to the button and try clicking
          await btn.scrollIntoViewIfNeeded();
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          await screenshot(page, '04-edit-role-modal', 'Edit Role Modal');
          foundEdit = true;

          // Close
          const closeBtn = await page.$('[aria-label="Close modal"]') || await page.$('button:has-text("Cancel")');
          if (closeBtn) {
            try { await closeBtn.click({ timeout: 3000 }); } catch(e) {}
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(500);
          break;
        } catch (e) {
          console.log(`    Click failed: ${e.message.split('\n')[0]}`);
        }
      }
    }

    if (!foundEdit) {
      console.log('  [NOTE] No edit role button found - checking if there are any roles to edit');
      // Check if there are any role cards/items displayed
      const pageText = await page.textContent('body');
      if (pageText.includes('No roles') || pageText.includes('no roles')) {
        console.log('  [CONFIRMED] No roles exist yet');
      }

      // Let's try to create a role first, then edit it
      const addBtn = await page.$('button:has-text("Add New Role")')
        || await page.$('button:has-text("New Role")')
        || await page.$('button:has-text("Create Role")')
        || await page.$('button:has-text("Add Role")');

      if (addBtn) {
        await addBtn.click();
        await page.waitForTimeout(1000);

        // Fill in role name
        const nameInput = await page.$('#role-name');
        if (nameInput) {
          await nameInput.fill('Engineering');
          await page.waitForTimeout(300);

          // Click create
          const createBtn = await page.$('button[aria-label="Create role"]');
          if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(2000);

            // Now try to edit it
            const editBtns = await page.$$('button');
            for (const btn of editBtns) {
              const text = (await btn.textContent()).trim();
              const ariaLabel = await btn.getAttribute('aria-label');
              if (text.toLowerCase().includes('edit') || (ariaLabel && ariaLabel.toLowerCase().includes('edit'))) {
                try {
                  await btn.scrollIntoViewIfNeeded();
                  await btn.click({ timeout: 3000 });
                  await page.waitForTimeout(1000);
                  await screenshot(page, '04-edit-role-modal', 'Edit Role Modal');
                  break;
                } catch(e) {}
              }
            }
          }
        }
      }
    }
  }

  // Go to Users tab
  console.log('\n--- Capturing Edit User Modal ---');
  // Escape any open modals first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const usersTab = await page.$('button:has-text("Users")');
  if (usersTab) {
    await usersTab.click();
    await page.waitForTimeout(1500);

    // List all visible buttons
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = (await btn.textContent()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const isVisible = await btn.isVisible();
      if (text.toLowerCase().includes('edit') || (ariaLabel && ariaLabel.toLowerCase().includes('edit'))) {
        console.log(`  User edit button: text="${text}", aria="${ariaLabel}", visible=${isVisible}`);
        if (isVisible) {
          try {
            await btn.click({ timeout: 3000 });
            await page.waitForTimeout(1000);
            await screenshot(page, '07-edit-user-modal', 'Edit User Modal');
            break;
          } catch(e) {
            console.log(`    Click failed: ${e.message.split('\n')[0]}`);
          }
        }
      }
    }
  }

  console.log('\n=== Done ===');
  await browser.close();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
