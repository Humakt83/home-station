import { expect, test } from '@playwright/test';

test('has dashboard of elements', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Junat')).toBeVisible();
	await expect(page.getByText('🗑️ ⚫ 🔴 🔵 🟢')).toBeVisible();
});
