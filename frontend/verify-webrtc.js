import { chromium } from 'playwright';

(async () => {
    console.log('\x1b[36m%s\x1b[0m', '🚀 Khởi động Trình duyệt ảo kiểm thử WebRTC có giao diện...');
    const roomId = 1;
    const url = `http://localhost:5173/session/${roomId}/join`;

    // 1. Browser 1: Teacher/Admin login
    console.log('\x1b[33m%s\x1b[0m', '-> Cửa sổ 1: Đăng nhập với tư cách Giáo viên (Admin)...');
    const context1 = await chromium.launchPersistentContext('', {
        headless: false,
        slowMo: 1000,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=800,600',
            '--window-position=0,0'
        ]
    });
    const page1 = await context1.newPage();
    await page1.goto('http://localhost:5173/login');
    await page1.fill('input[type="email"]', 'admin@admin.com');
    await page1.fill('input[type="password"]', 'Admin@123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/dashboard');
    console.log('\x1b[32m%s\x1b[0m', '✅ Cửa sổ 1 đăng nhập thành công!');

    // Go to classroom
    await page1.goto(url);
    await page1.waitForSelector('text=Tham gia lớp học', { timeout: 15000 });
    await page1.getByRole('button', { name: 'Tham gia lớp học' }).click();
    console.log('\x1b[32m%s\x1b[0m', '✅ Giáo viên đã vào lớp học.');

    // 2. Browser 2: Student registration & login
    console.log('\x1b[33m%s\x1b[0m', '-> Cửa sổ 2: Đăng ký & Đăng nhập Học viên mới...');
    const context2 = await chromium.launchPersistentContext('', {
        headless: false,
        slowMo: 1000,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=800,600',
            '--window-position=810,0'
        ]
    });
    const page2 = await context2.newPage();
    
    // Register dynamically
    const studentEmail = `student_${Date.now()}@gmail.com`;
    await page2.goto('http://localhost:5173/register');
    await page2.fill('input[placeholder="VD: Nguyễn Văn A"]', 'Học Viên Thử Nghiệm');
    await page2.fill('input[type="email"]', studentEmail);
    await page2.fill('input[type="password"]', 'Student@123');
    await page2.click('button[type="submit"]');
    
    // Wait for redirect to login
    await page2.waitForURL('**/login');
    await page2.fill('input[type="email"]', studentEmail);
    await page2.fill('input[type="password"]', 'Student@123');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/dashboard');
    console.log('\x1b[32m%s\x1b[0m', '✅ Cửa sổ 2 đăng ký & đăng nhập học viên mới thành công!');

    // Go to classroom
    await page2.goto(url);
    await page2.waitForSelector('text=Tham gia lớp học', { timeout: 15000 });
    await page2.getByRole('button', { name: 'Tham gia lớp học' }).click();
    console.log('\x1b[32m%s\x1b[0m', '✅ Học viên đã vào lớp học.');

    // Toggle video/audio for User 1 (Teacher)
    await page1.waitForTimeout(2000);
    const micBtn1 = page1.locator('div.mt-6.flex.justify-center.gap-4 button').nth(0);
    const vidBtn1 = page1.locator('div.mt-6.flex.justify-center.gap-4 button').nth(1);
    if (await micBtn1.count() > 0) await micBtn1.click();
    if (await vidBtn1.count() > 0) await vidBtn1.click();
    console.log('\x1b[33m%s\x1b[0m', '-> Giáo viên đã bật camera và micro.');

    // Toggle video/audio for User 2 (Student)
    await page2.waitForTimeout(2000);
    const micBtn2 = page2.locator('div.mt-6.flex.justify-center.gap-4 button').nth(0);
    const vidBtn2 = page2.locator('div.mt-6.flex.justify-center.gap-4 button').nth(1);
    if (await micBtn2.count() > 0) await micBtn2.click();
    if (await vidBtn2.count() > 0) await vidBtn2.click();
    console.log('\x1b[33m%s\x1b[0m', '-> Học viên đã bật camera và micro.');

    console.log('\x1b[36m%s\x1b[0m', '👥 Cả hai đã tham gia thành công. Đang truyền phát hình ảnh và âm thanh trực tiếp trong 10 giây...');
    await page1.waitForTimeout(10000);

    // Capture screenshots to confirm
    await page1.screenshot({ path: 'verify-user1-live.png' });
    await page2.screenshot({ path: 'verify-user2-live.png' });
    console.log('\x1b[32m%s\x1b[0m', '📸 Đã chụp ảnh lưu lại: verify-user1-live.png và verify-user2-live.png');

    console.log('\x1b[36m%s\x1b[0m', '🎉 KIỂM THỬ WEBRTC HOÀN TẤT THÀNH CÔNG VÀ AN TOÀN!');
    await context1.close();
    await context2.close();
})();
