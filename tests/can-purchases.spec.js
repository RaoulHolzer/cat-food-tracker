const { test, expect } = require('@playwright/test');

// Helper to login first
async function login(page) {
  await page.goto('/');
  await page.fill('[data-testid="input-username"]', 'margot');
  await page.fill('[data-testid="input-password"]', 'margot');
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('**/app');
}

test('Add and delete can purchases', async ({ page }) => {
  await login(page);
  
  // Add first can purchase
  await page.fill('[data-testid="input-can-quantity"]', '24');
  await page.fill('[data-testid="input-can-notes"]', 'Supermarkt Angebot');
  await page.click('[data-testid="btn-add-can-purchase"]');

  // Wait for can purchases section to appear
  await page.waitForSelector('.can-purchases-card', { timeout: 5000 });
  
  // Verify the purchase is displayed
  const canPurchasesCard = page.locator('.can-purchases-card');
  await expect(canPurchasesCard).toBeVisible();
  await expect(canPurchasesCard.locator('.purchase-quantity')).toContainText('24 Dosen');
  await expect(canPurchasesCard.locator('.purchase-notes')).toContainText('Supermarkt Angebot');
  await expect(canPurchasesCard.locator('.total-cans strong')).toContainText('24 Dosen');

  // Add second can purchase
  await page.fill('[data-testid="input-can-quantity"]', '12');
  await page.fill('[data-testid="input-can-notes"]', 'Online bestellt');
  await page.click('[data-testid="btn-add-can-purchase"]');

  // Wait for update and verify total
  await expect(canPurchasesCard.locator('.total-cans strong')).toContainText('36 Dosen');
  await expect(page.locator('.purchase-entry')).toHaveCount(2);

  // Delete first purchase
  page.on('dialog', dialog => dialog.accept());
  await page.locator('.purchase-entry').first().locator('.delete-purchase').click();
  
  // Verify total is updated
  await expect(canPurchasesCard.locator('.total-cans strong')).toContainText('12 Dosen');
  await expect(page.locator('.purchase-entry')).toHaveCount(1);
});
