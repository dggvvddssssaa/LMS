/**
 * SessionModel — lightweight query helper used by the socket layer.
 * Delegates to the same db pool as the rest of the backend.
 */
const db = require('../config/db');

class SessionModel {
    static async getById(id) {
        const result = await db.query(`
            SELECT s.*, lc.course_id,
                   c.instructor_id, c.title as course_title
            FROM sessions s
            LEFT JOIN live_classes lc ON s.live_class_id = lc.id
            LEFT JOIN courses c ON lc.course_id = c.id
            WHERE s.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async getByMeetingId(meetingId) {
        const result = await db.query(`
            SELECT s.*, lc.course_id,
                   c.instructor_id, c.title as course_title
            FROM sessions s
            LEFT JOIN live_classes lc ON s.live_class_id = lc.id
            LEFT JOIN courses c ON lc.course_id = c.id
            WHERE s.meeting_id = $1
        `, [meetingId]);
        return result.rows[0];
    }

    static async recordJoin(sessionId, userId) {
        const result = await db.query(
            'INSERT INTO session_attendance (session_id, student_id, joined_at) VALUES ($1, $2, NOW()) RETURNING *',
            [sessionId, userId]
        );
        return result.rows[0];
    }

    static async recordLeave(sessionId, userId) {
        const result = await db.query(
            'UPDATE session_attendance SET left_at = NOW() WHERE session_id = $1 AND student_id = $2 AND left_at IS NULL RETURNING *',
            [sessionId, userId]
        );
        return result.rows[0];
    }
}

module.exports = SessionModel;
