import { test, expect } from '@playwright/test';

test('student flow smoke - public pages load', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LMS|React|Vite/i);

  await page.goto('/courses');
  await expect(page.locator('#courses-listing')).toBeVisible();
});
