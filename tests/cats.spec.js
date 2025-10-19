const { test, expect } = require('@playwright/test');

// Helper to login first
async function login(page) {
  await page.goto('/');
  await page.fill('[data-testid="input-username"]', 'margot');
  await page.fill('[data-testid="input-password"]', 'margot');
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('**/app');
}

test('Add, feed, and delete a cat', async ({ page }) => {
  await login(page);
  // Add cat
  const catName = 'Testi';
  await page.fill('[data-testid="input-cat-name"]', catName);
  await page.click('[data-testid="btn-add-cat"]');

  // Wait for cat card to appear
  const catCard = page.locator('.cat-card:has-text("' + catName + '")');
  await expect(catCard).toBeVisible();

  // Add feeding
  const feedingInput = catCard.locator('input[placeholder="Menge (z.B. 1 Tasse, 50g)"]');
  await feedingInput.fill('50g');
  await catCard.locator('button.feed-btn').click();

  // Verify feeding entry
  await expect(catCard.locator('.feeding-entry')).toHaveCount(1);
  await expect(catCard.locator('.feeding-entry .feeding-amount')).toContainText('50g');

  // Delete feeding
  await catCard.locator('.feeding-entry .delete-feeding').click();
  await expect(catCard.locator('.feeding-entry')).toHaveCount(0);

  // Delete cat
  page.on('dialog', dialog => dialog.accept());
  await catCard.locator('button.delete-btn').click();
  await expect(catCard).toHaveCount(0);
});