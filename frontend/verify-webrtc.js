import { chromium } from 'playwright';

(async () => {
    console.log('Starting WebRTC Test with 2 users...');
    const roomId = 1; // Assuming session ID 1 exists, or we just hit the URL
    const url = `http://localhost:5173/session/${roomId}/join`;

    // Browser 1 (Teacher/User 1)
    const context1 = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=800,600',
            '--window-position=0,0'
        ]
    });
    const page1 = await context1.newPage();
    console.log('User 1 entering classroom...');
    await page1.goto(url);
    await page1.waitForSelector('text=Tham gia lớp học', { timeout: 30000 });
    await page1.getByRole('button', { name: 'Tham gia lớp học' }).click();

    // Toggle video/audio for User 1
    await page1.waitForTimeout(2000);
    const micBtn1 = page1.locator('div.mt-6.flex.justify-center.gap-4 button').nth(0);
    const vidBtn1 = page1.locator('div.mt-6.flex.justify-center.gap-4 button').nth(1);

    if (await micBtn1.count() > 0) await micBtn1.click();
    if (await vidBtn1.count() > 0) await vidBtn1.click();
    console.log('User 1 turned on mic and camera.');

    // Browser 2 (Student/User 2)
    const context2 = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=800,600',
            '--window-position=850,0'
        ]
    });
    const page2 = await context2.newPage();
    console.log('User 2 entering classroom...');
    await page2.goto(url);
    await page2.waitForSelector('text=Tham gia lớp học', { timeout: 30000 });
    await page2.getByRole('button', { name: 'Tham gia lớp học' }).click();

    // Toggle video/audio for User 2
    await page2.waitForTimeout(2000);
    const micBtn2 = page2.locator('div.mt-6.flex.justify-center.gap-4 button').nth(0);
    const vidBtn2 = page2.locator('div.mt-6.flex.justify-center.gap-4 button').nth(1);

    if (await micBtn2.count() > 0) await micBtn2.click();
    if (await vidBtn2.count() > 0) await vidBtn2.click();
    console.log('User 2 turned on mic and camera.');

    console.log('Both users joined. Waiting 10 seconds to stream media...');
    await page1.waitForTimeout(10000);

    // Take screenshots to verify rendering
    await page1.screenshot({ path: 'verify-user1.png' });
    await page2.screenshot({ path: 'verify-user2.png' });

    console.log('Test complete. Screenshots saved.');
    await context1.close();
    await context2.close();
})();
