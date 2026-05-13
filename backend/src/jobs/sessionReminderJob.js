/**
 * Session reminder job — runs periodically to send notifications
 * for upcoming sessions.
 * 
 * Reminders:
 * - 30 minutes before session start
 * - Sessions starting today (morning batch)
 */
const db = require('../config/db');
const NotificationService = require('../services/NotificationService');
const logger = require('../utils/logger');

// Track which reminders have already been sent to avoid duplicates
const sentReminders = new Set(); // Format: "session_{id}_30min" or "session_{id}_today"

async function checkUpcomingReminders() {
    try {
        // Find sessions starting within 30 minutes that haven't been notified
        const { rows: upcoming } = await db.query(`
            SELECT s.id, s.title, s.start_time, s.meeting_id, lc.course_id
            FROM sessions s
            JOIN live_classes lc ON s.live_class_id = lc.id
            WHERE s.status IN ('scheduled', 'open')
              AND s.start_time > NOW()
              AND s.start_time <= NOW() + INTERVAL '35 minutes'
        `);

        for (const session of upcoming) {
            const key30 = `session_${session.id}_30min`;
            if (!sentReminders.has(key30)) {
                const startStr = new Date(session.start_time).toLocaleString('vi-VN');
                const message = `⏰ Lớp "${session.title}" sẽ bắt đầu lúc ${startStr} (còn ~30 phút)`;
                const link = `/session/${session.meeting_id}/join`;

                await NotificationService.notifyEnrolledStudents(
                    session.course_id, message, 'session_reminder', link
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
        const { rows: todaySessions } = await db.query(`
            SELECT s.id, s.title, s.start_time, s.meeting_id, lc.course_id
            FROM sessions s
            JOIN live_classes lc ON s.live_class_id = lc.id
            WHERE s.status IN ('scheduled', 'open')
              AND s.start_time >= CURRENT_DATE
              AND s.start_time < CURRENT_DATE + INTERVAL '1 day'
        `);

        for (const session of todaySessions) {
            const keyToday = `session_${session.id}_today`;
            if (!sentReminders.has(keyToday)) {
                const startStr = new Date(session.start_time).toLocaleString('vi-VN');
                const message = `📅 Hôm nay bạn có lớp "${session.title}" lúc ${startStr}`;
                const link = `/session/${session.meeting_id}/join`;

                await NotificationService.notifyEnrolledStudents(
                    session.course_id, message, 'session_today', link
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
