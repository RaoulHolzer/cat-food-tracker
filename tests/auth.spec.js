const { test, expect } = require('@playwright/test');

// Failed login should show error
test('Shows error on invalid login', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="input-username"]', 'wrong');
  await page.fill('[data-testid="input-password"]', 'wrong');
  await page.click('[data-testid="btn-login"]');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Ungültiger Benutzername oder Passwort');
});