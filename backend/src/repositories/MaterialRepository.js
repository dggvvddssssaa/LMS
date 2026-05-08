const db = require('../config/db');

class MaterialRepository {
  async findByCourseId(courseId) {
    const query = `
      SELECT * FROM course_materials
      WHERE course_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [courseId]);
    return result.rows;
  }

  async create(data) {
    const { course_id, title, file_url, file_type } = data;
    const query = `
      INSERT INTO course_materials (course_id, title, file_url, file_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [course_id, title, file_url, file_type || 'document']);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM course_materials WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new MaterialRepository();
