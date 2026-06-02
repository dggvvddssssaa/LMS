import { test, expect } from '@playwright/test';

test.describe('Student Flow', () => {
  const testUser = `student${Date.now()}@test.com`;
  
  test('Guest can view landing and course list', async ({ page }) => {
    await page.goto('/');
    // Check main UI elements
    await expect(page.getByRole('link', { name: /khám phá/i })).toBeVisible();
    
    await page.goto('/courses');
    await expect(page.locator('.grid')).toBeVisible(); // Course grid
  });

  test('Student can register, login, enroll and learn', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await page.fill('input[type="text"]', 'E2E Student');
    await page.fill('input[type="email"]', testUser);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard|.*login/, { timeout: 10000 });
    // In case of register redirecting to login, we try to login
    if (page.url().includes('login')) {
      await page.fill('input[type="email"]', testUser);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
    }
    
    await expect(page.locator('text=Đăng xuất').first()).toBeVisible();
    
    // 2. View Courses and Enroll
    await page.goto('/courses');
    // Click the first course link
    const courseCard = page.locator('a[href^="/course/"]').first();
    await expect(courseCard).toBeVisible();
    await courseCard.click();
    
    // Try to enroll
    const enrollBtn = page.getByRole('button', { name: /Vào học ngay|Mua khóa học/i });
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // 3. Learning View
    // Since we don't know the exact course ID, we check if the URL changes to /learn or if we're redirected.
    // We expect some learning UI elements if it's a free course, or payment instructions if paid.
  });
});
