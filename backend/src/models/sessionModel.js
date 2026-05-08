const { pool } = require('../utils/db');

class SessionModel {
    static async create({ course_id, title, start_time }) {
        const result = await pool.query(
            'INSERT INTO sessions (course_id, title, start_time) VALUES ($1, $2, $3) RETURNING *',
            [course_id, title, start_time]
        );
        return result.rows[0];
    }

    static async getByCourse(courseId) {
        const result = await pool.query('SELECT * FROM sessions WHERE course_id = $1 ORDER BY start_time ASC', [courseId]);
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async getByMeetingId(meetingId) {
        const result = await pool.query('SELECT * FROM sessions WHERE meeting_id = $1', [meetingId]);
        return result.rows[0];
    }

    static async updateStatus(id, isActive) {
        const result = await pool.query(
            'UPDATE sessions SET is_active = $1 WHERE id = $2 RETURNING *',
            [isActive, id]
        );
        return result.rows[0];
    }
}

module.exports = SessionModel;
