const { test, expect } = require('@playwright/test');

test('Login as margot and open app', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('#username', 'margot');
  await page.fill('#password', 'margot');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app');
  await expect(page).toHaveURL(/.*\/app/);
  await expect(page.locator('body')).toContainText('Katze'); // Checks for app content
});