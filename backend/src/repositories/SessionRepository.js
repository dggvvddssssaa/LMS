const crypto = require('crypto');
const db = require('../config/db');

class SessionRepository {
  async create({ liveClassId, title, start_time }) {
    // Generate a unique room ID
    const meeting_id = crypto.randomUUID();
    const query = `
      INSERT INTO sessions (live_class_id, title, start_time, meeting_id, status) 
      VALUES ($1, $2, $3, $4, 'scheduled') 
      RETURNING *
    `;
    const result = await db.query(query, [liveClassId, title, start_time, meeting_id]);
    return result.rows[0];
  }

  async findByLiveClassId(liveClassId) {
    const query = 'SELECT * FROM sessions WHERE live_class_id = $1 ORDER BY start_time ASC';
    const result = await db.query(query, [liveClassId]);
    return result.rows;
  }

  async update(id, data) {
    const { title, start_time, end_time, status } = data;
    const query = `
      UPDATE sessions
      SET title = COALESCE($1, title),
          start_time = COALESCE($2, start_time),
          end_time = COALESCE($3, end_time),
          status = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
    `;
    const result = await db.query(query, [
      title, start_time, end_time, status, id
    ]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM sessions WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findActiveSessions() {
    const query = `
      SELECT s.id, s.title, s.start_time, s.status, s.meeting_id,
             c.title as course_title, u.name as instructor_name, u.email as instructor_email
      FROM sessions s
      JOIN live_classes lc ON s.live_class_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE s.status IN ('scheduled', 'ongoing')
      ORDER BY s.start_time DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}
module.exports = new SessionRepository();
