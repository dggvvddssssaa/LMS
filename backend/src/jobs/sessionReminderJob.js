/**
 * Session reminder job — runs periodically to send notifications
 * for upcoming sessions.
 * 
 * Reminders:
 * - 30 minutes before session start
 * - Sessions starting today (morning batch)
 */
const prisma = require('../config/prisma');
const NotificationService = require('../services/NotificationService');
const logger = require('../utils/logger');

// Track which reminders have already been sent to avoid duplicates
const sentReminders = new Set(); // Format: "session_{id}_30min" or "session_{id}_today"

async function checkUpcomingReminders() {
    try {
        // Find sessions starting within 35 minutes that haven't been notified
        const now = new Date();
        const thirtyFiveMinLater = new Date(now.getTime() + 35 * 60 * 1000);

        const upcoming = await prisma.sessions.findMany({
            where: {
                status: { in: ['scheduled', 'open'] },
                start_time: { gt: now, lte: thirtyFiveMinLater }
            },
            select: {
                id: true,
                title: true,
                start_time: true,
                meeting_id: true,
                live_classes: { select: { course_id: true } }
            }
        });

        for (const session of upcoming) {
            const key30 = `session_${session.id}_30min`;
            if (!sentReminders.has(key30)) {
                const courseId = session.live_classes ? Number(session.live_classes.course_id) : null;
                if (!courseId) continue;

                const startStr = new Date(session.start_time).toLocaleString('vi-VN');
                const message = `⏰ Lớp "${session.title}" sẽ bắt đầu lúc ${startStr} (còn ~30 phút)`;
                const link = `/session/${session.meeting_id}/join`;

                await NotificationService.notifyEnrolledStudents(
                    courseId, message, 'session_reminder', link
                );

                sentReminders.add(key30);
                logger.info(`Sent 30-min reminder for session ${session.id}`);
            }
        }
    } catch (err) {
        logger.error(`Session reminder job error: ${err.message}`);
    }
}

async function checkTodaySessions() {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const todaySessions = await prisma.sessions.findMany({
            where: {
                status: { in: ['scheduled', 'open'] },
                start_time: { gte: todayStart, lt: tomorrowStart }
            },
            select: {
                id: true,
                title: true,
                start_time: true,
                meeting_id: true,
                live_classes: { select: { course_id: true } }
            }
        });

        for (const session of todaySessions) {
            const keyToday = `session_${session.id}_today`;
            if (!sentReminders.has(keyToday)) {
                const courseId = session.live_classes ? Number(session.live_classes.course_id) : null;
                if (!courseId) continue;

                const startStr = new Date(session.start_time).toLocaleString('vi-VN');
                const message = `📅 Hôm nay bạn có lớp "${session.title}" lúc ${startStr}`;
                const link = `/session/${session.meeting_id}/join`;

                await NotificationService.notifyEnrolledStudents(
                    courseId, message, 'session_today', link
                );

                sentReminders.add(keyToday);
                logger.info(`Sent today notification for session ${session.id}`);
            }
        }
    } catch (err) {
        logger.error(`Today session notification error: ${err.message}`);
    }
}

// Clear old reminder keys daily to prevent memory leak
function clearOldReminders() {
    sentReminders.clear();
    logger.info('Cleared session reminder cache');
}

let reminderInterval = null;
let todayInterval = null;
let clearInterval_ = null;

function startSessionReminderJob() {
    logger.info('Starting session reminder job');

    // Check every 5 minutes for 30-min reminders
    reminderInterval = setInterval(checkUpcomingReminders, 5 * 60 * 1000);

    // Check every 30 minutes for today's sessions  
    todayInterval = setInterval(checkTodaySessions, 30 * 60 * 1000);

    // Clear cache every 24 hours
    clearInterval_ = setInterval(clearOldReminders, 24 * 60 * 60 * 1000);

    // Run immediately on startup
    checkTodaySessions();
    checkUpcomingReminders();
}

function stopSessionReminderJob() {
    if (reminderInterval) clearInterval(reminderInterval);
    if (todayInterval) clearInterval(todayInterval);
    if (clearInterval_) clearInterval(clearInterval_);
}

module.exports = { startSessionReminderJob, stopSessionReminderJob };
