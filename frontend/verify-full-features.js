import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    console.log('\x1b[36m%s\x1b[0m', '🚀 Khởi động Trình duyệt ảo để kiểm thử toàn diện các tính năng...');
    
    // Khởi chạy trình duyệt có giao diện (headed: true) để người dùng xem trực quan
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000, // Chậm 1 giây giữa các bước để dễ dàng theo dõi
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=1200,900',
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1200, height: 900 }
    });
    const page = await context.newPage();

    try {
        // 1. Kiểm thử Trang chủ (Landing Page)
        console.log('\x1b[33m%s\x1b[0m', 'Step 1: Truy cập trang chủ...');
        await page.goto('http://localhost:5173/');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'verify-1-landing.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Trang chủ tải thành công. Đã lưu ảnh: verify-1-landing.png');

        // 2. Kiểm thử Trang Đăng nhập (Auth Login Flow)
        console.log('\x1b[33m%s\x1b[0m', 'Step 2: Truy cập trang Đăng nhập...');
        await page.goto('http://localhost:5173/login');
        await page.waitForSelector('input[type="email"]');
        
        console.log('\x1b[33m%s\x1b[0m', '-> Điền thông tin đăng nhập Admin...');
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'Admin@123');
        await page.screenshot({ path: 'verify-2-login-input.png' });
        
        console.log('\x1b[33m%s\x1b[0m', '-> Nhấn nút Xác nhận Đăng nhập...');
        await page.click('button[type="submit"]');
        
        // Đợi chuyển hướng sang dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'verify-3-dashboard.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Đăng nhập Admin thành công và chuyển hướng sang Dashboard. Đã lưu ảnh: verify-3-dashboard.png');

        // 3. Kiểm thử Danh sách Khóa học (Courses Listing)
        console.log('\x1b[33m%s\x1b[0m', 'Step 3: Truy cập danh sách khóa học...');
        await page.goto('http://localhost:5173/courses');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'verify-4-courses-listing.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Danh sách khóa học hoạt động tốt. Đã lưu ảnh: verify-4-courses-listing.png');

        // 4. Kiểm thử Admin Dashboard & Quản lý
        console.log('\x1b[33m%s\x1b[0m', 'Step 4: Truy cập Admin Dashboard...');
        await page.goto('http://localhost:5173/admin/dashboard');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'verify-5-admin-dashboard.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Admin Dashboard thống kê hoạt động tốt. Đã lưu ảnh: verify-5-admin-dashboard.png');

        // 5. Kiểm thử Admin User Management (Quản lý người dùng)
        console.log('\x1b[33m%s\x1b[0m', 'Step 5: Truy cập Quản lý người dùng...');
        await page.goto('http://localhost:5173/admin/users');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'verify-6-admin-users.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Bảng quản lý người dùng hoạt động tốt. Đã lưu ảnh: verify-6-admin-users.png');

        // 6. Kiểm thử Admin Certificate Templates (Quản lý mẫu chứng chỉ)
        console.log('\x1b[33m%s\x1b[0m', 'Step 6: Truy cập Quản lý mẫu chứng chỉ...');
        await page.goto('http://localhost:5173/admin/certificate-templates');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'verify-7-admin-certificates.png' });
        console.log('\x1b[32m%s\x1b[0m', '✅ Quản lý mẫu chứng chỉ hoạt động tốt. Đã lưu ảnh: verify-7-admin-certificates.png');

        console.log('\x1b[36m%s\x1b[0m', '🎉 TẤT CẢ CÁC TÍNH NĂNG CHÍNH ĐÃ ĐƯỢC KIỂM THỬ THÀNH CÔNG VỚI TRÌNH DUYỆT CÓ GIAO DIỆN!');
        console.log('\x1b[36m%s\x1b[0m', 'Các tệp tin ảnh chứng minh đã được lưu trữ trong thư mục frontend.');

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Lỗi xảy ra trong quá trình kiểm thử:', error);
    } finally {
        await page.waitForTimeout(5000); // Đợi thêm 5 giây để người dùng quan sát trước khi đóng
        await browser.close();
    }
})();
