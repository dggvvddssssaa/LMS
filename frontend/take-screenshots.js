import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:\\Users\\nhocb\\Downloads\\New folder';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

(async () => {
  console.log('Khởi động trình duyệt Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  // Set default timeout to 60 seconds because Render backend might be sleeping
  page.setDefaultTimeout(60000);
  
  const BASE_URL = 'https://lms-frontend-9v1p.onrender.com';

  try {
    console.log('1. Chụp trang chủ (Landing)');
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '1_LandingPage.png'), fullPage: true });

    console.log('2. Chụp trang Danh sách Khóa học (Public)');
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForTimeout(3000); 
    await page.screenshot({ path: path.join(OUT_DIR, '2_CourseList.png'), fullPage: true });

    console.log('3. Chụp trang Đăng nhập');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '3_Login.png'), fullPage: true });

    console.log('-> Đang đăng nhập tài khoản Admin (có thể mất 50s nếu Backend đang ngủ)...');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Wait for response from API (login) and navigation
    await Promise.all([
      page.waitForURL('**/admin**', { timeout: 60000 }).catch(() => console.log('Chờ URL thay đổi bị timeout nhưng vẫn tiếp tục...')),
      page.click('button[type="submit"]')
    ]);
    
    await page.waitForTimeout(5000);

    console.log('4. Chụp Dashboard Admin');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '4_AdminDashboard.png'), fullPage: true });

    console.log('5. Chụp Quản lý Khóa học');
    await page.goto(`${BASE_URL}/admin/courses`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '5_AdminCourses.png'), fullPage: true });

    console.log('6. Chụp Quản lý Học viên & Tặng Khóa Học');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '6_AdminUsers.png'), fullPage: true });

    console.log('7. Chụp Quản lý Mẫu Chứng Chỉ');
    await page.goto(`${BASE_URL}/admin/certificates/templates`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '7_AdminCertificates.png'), fullPage: true });

    console.log('✅ Đã chụp thành công! Hình ảnh được lưu tại:', OUT_DIR);
  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình chụp:', error);
  } finally {
    await browser.close();
  }
})();
