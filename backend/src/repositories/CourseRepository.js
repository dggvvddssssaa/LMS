const db = require('../config/db');
const { sanitizeUpdateData } = require('../utils/columnWhitelist');

class CourseRepository {
  async create(courseData) {
    const { 
      title, description, instructor_id, thumbnail, type, price, is_published,
      sale_price, duration_total_minutes, video_count, what_you_will_learn 
    } = courseData;
    const query = `
      INSERT INTO courses (
        title, description, instructor_id, thumbnail, type, price, is_published,
        sale_price, duration_total_minutes, video_count, what_you_will_learn
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const result = await db.query(query, [
      title, description, instructor_id, thumbnail, type, price || 0, is_published || false,
      sale_price || 0, duration_total_minutes || 0, video_count || 0, what_you_will_learn || []
    ]);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT c.*, u.name as instructor_name 
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}) {
    let query = `
      SELECT c.*, u.name as instructor_name 
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.type) {
      query += ` AND c.type = $${paramIndex++}`;
      params.push(filters.type);
    }
    
    if (filters.is_published !== undefined) {
      query += ` AND c.is_published = $${paramIndex++}`;
      params.push(filters.is_published);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async update(id, updateData) {
    updateData = sanitizeUpdateData('courses', updateData);
    const fields = [];
    const values = [];
    let query = 'UPDATE courses SET ';

    Object.keys(updateData).forEach((key, index) => {
      fields.push(`${key} = $${index + 1}`);
      values.push(updateData[key]);
    });

    if (fields.length === 0) return null;

    query += fields.join(', ') + `, created_at = created_at WHERE id = $${fields.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM courses WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new CourseRepository();
