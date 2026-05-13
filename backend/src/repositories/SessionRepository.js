const crypto = require('crypto');
const db = require('../config/db');

class SessionRepository {
  async create({ liveClassId, title, start_time, end_time, teacher_id, join_open_minutes }) {
    const meeting_id = crypto.randomUUID();
    const query = `
      INSERT INTO sessions (live_class_id, title, start_time, end_time, teacher_id, join_open_minutes, meeting_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *
    `;
    const result = await db.query(query, [
      liveClassId, title, start_time, end_time || null,
      teacher_id || null, join_open_minutes || 15, meeting_id
    ]);
    return result.rows[0];
  }

  async findByLiveClassId(liveClassId) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.live_class_id = $1
      ORDER BY s.start_time ASC
    `;
    const result = await db.query(query, [liveClassId]);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT s.*, lc.course_id,
             u.name as teacher_name, u.email as teacher_email,
             c.title as course_title, c.instructor_id
      FROM sessions s
      LEFT JOIN live_classes lc ON s.live_class_id = lc.id
      LEFT JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByMeetingId(meetingId) {
    const query = `
      SELECT s.*, lc.course_id,
             u.name as teacher_name, u.email as teacher_email,
             c.title as course_title, c.instructor_id
      FROM sessions s
      LEFT JOIN live_classes lc ON s.live_class_id = lc.id
      LEFT JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.meeting_id = $1
    `;
    const result = await db.query(query, [meetingId]);
    return result.rows[0];
  }

  async update(id, data) {
    const allowedFields = ['title', 'start_time', 'end_time', 'status', 'teacher_id',
      'opened_at', 'closed_at', 'join_open_minutes', 'recording_url', 'notes'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    const query = `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(id);
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async openSession(id) {
    const query = `
      UPDATE sessions
      SET status = 'open', opened_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async startSession(id) {
    const query = `
      UPDATE sessions
      SET status = 'ongoing'
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async endSession(id) {
    const query = `
      UPDATE sessions
      SET status = 'ended', closed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM sessions WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findActiveSessions() {
    const query = `
      SELECT s.id, s.title, s.start_time, s.end_time, s.status, s.meeting_id,
             s.teacher_id, s.opened_at, s.closed_at,
             c.title as course_title, c.id as course_id,
             u.name as instructor_name, u.email as instructor_email,
             tu.name as teacher_name, tu.email as teacher_email
      FROM sessions s
      JOIN live_classes lc ON s.live_class_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN users tu ON s.teacher_id = tu.id
      WHERE s.status IN ('scheduled', 'open', 'ongoing')
      ORDER BY s.start_time ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findToday() {
    const query = `
      SELECT s.id, s.title, s.start_time, s.end_time, s.status, s.meeting_id,
             s.teacher_id, s.opened_at, s.join_open_minutes,
             c.title as course_title, c.id as course_id,
             tu.name as teacher_name
      FROM sessions s
      JOIN live_classes lc ON s.live_class_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users tu ON s.teacher_id = tu.id
      WHERE s.start_time >= CURRENT_DATE
        AND s.start_time < CURRENT_DATE + INTERVAL '1 day'
      ORDER BY s.start_time ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findByTeacherToday(teacherId) {
    const query = `
      SELECT s.id, s.title, s.start_time, s.end_time, s.status, s.meeting_id,
             s.teacher_id, s.opened_at, s.join_open_minutes,
             c.title as course_title, c.id as course_id
      FROM sessions s
      JOIN live_classes lc ON s.live_class_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      WHERE s.teacher_id = $1
        AND s.start_time >= CURRENT_DATE
        AND s.start_time < CURRENT_DATE + INTERVAL '1 day'
      ORDER BY s.start_time ASC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  async findByTeacherUpcoming(teacherId) {
    const query = `
      SELECT s.id, s.title, s.start_time, s.end_time, s.status, s.meeting_id,
             s.teacher_id, s.opened_at, s.join_open_minutes,
             c.title as course_title, c.id as course_id
      FROM sessions s
      JOIN live_classes lc ON s.live_class_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      WHERE s.teacher_id = $1
        AND s.status IN ('scheduled', 'open', 'ongoing')
        AND s.start_time >= CURRENT_DATE
      ORDER BY s.start_time ASC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  // Attendance
  async recordJoin(sessionId, userId) {
    // Check for existing open attendance row (no left_at) to prevent duplicates on reconnect
    const existingQuery = `
      SELECT * FROM session_attendance
      WHERE session_id = $1 AND student_id = $2 AND left_at IS NULL
      ORDER BY joined_at DESC LIMIT 1
    `;
    const existing = await db.query(existingQuery, [sessionId, userId]);
    if (existing.rows.length > 0) {
      return existing.rows[0]; // Already has an open attendance, return it
    }

    const query = `
      INSERT INTO session_attendance (session_id, student_id, joined_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [sessionId, userId]);
    return result.rows[0];
  }

  async recordLeave(sessionId, userId) {
    const query = `
      UPDATE session_attendance
      SET left_at = NOW()
      WHERE session_id = $1 AND student_id = $2 AND left_at IS NULL
      RETURNING *
    `;
    const result = await db.query(query, [sessionId, userId]);
    return result.rows[0];
  }
}

module.exports = new SessionRepository();
