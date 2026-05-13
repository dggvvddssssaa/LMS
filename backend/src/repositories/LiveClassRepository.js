const db = require('../config/db');
const { sanitizeUpdateData } = require('../utils/columnWhitelist');

class LiveClassRepository {
  async create(liveClassData, client) {
    const queryRunner = client || db;
    const { course_id, schedule_config, total_sessions, max_students, status } = liveClassData;
    const query = `
      INSERT INTO live_classes (course_id, schedule_config, total_sessions, max_students, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await queryRunner.query(query, [
      course_id, 
      schedule_config, 
      total_sessions || 0, 
      max_students || 0, 
      status || 'upcoming'
    ]);
    return result.rows[0];
  }

  async findByCourseId(courseId) {
    const query = `
      SELECT lc.*, c.title as course_title 
      FROM live_classes lc
      JOIN courses c ON lc.course_id = c.id
      WHERE lc.course_id = $1
    `;
    const result = await db.query(query, [courseId]);
    return result.rows[0];
  }

  async findActiveRooms() {
    const query = `
      SELECT lc.id, lc.course_id, c.title as course_title, u.name as instructor_name, lc.created_at, lc.status
      FROM live_classes lc
      JOIN courses c ON lc.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE lc.status = 'active' OR lc.status = 'scheduled'
      ORDER BY lc.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = `SELECT * FROM live_classes WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async update(id, updateData) {
    updateData = sanitizeUpdateData('live_classes', updateData);
    const fields = [];
    const values = [];
    let query = 'UPDATE live_classes SET ';

    Object.keys(updateData).forEach((key, index) => {
      // For JSONB columns need careful handling if extending arrays, but direct replace works for basic jsonb
      fields.push(`${key} = $${index + 1}`);
      values.push(updateData[key]);
    });

    if (fields.length === 0) return null;

    query += fields.join(', ') + ` WHERE id = $${fields.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new LiveClassRepository();
