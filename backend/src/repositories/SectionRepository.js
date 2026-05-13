const db = require('../config/db');
const { sanitizeUpdateData } = require('../utils/columnWhitelist');

class SectionRepository {
  async create(sectionData) {
    const { course_id, title, order_index } = sectionData;
    const query = `
      INSERT INTO sections (course_id, title, order_index)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [course_id, title, order_index || 0]);
    return result.rows[0];
  }

  async batchUpdateOrder(updates) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const update of updates) {
        const { id, order_index } = update;
        const res = await client.query('UPDATE sections SET order_index = $1 WHERE id = $2 RETURNING *', [order_index, id]);
        results.push(res.rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByCourseId(courseId) {
    const query = `
      SELECT * FROM sections
      WHERE course_id = $1
      ORDER BY order_index ASC, id ASC
    `;
    const result = await db.query(query, [courseId]);
    return result.rows;
  }

  async update(id, updateData) {
    updateData = sanitizeUpdateData('sections', updateData);
    const fields = [];
    const values = [];
    let query = 'UPDATE sections SET ';

    Object.keys(updateData).forEach((key, index) => {
      fields.push(`${key} = $${index + 1}`);
      values.push(updateData[key]);
    });

    if (fields.length === 0) return null;

    query += fields.join(', ') + ` WHERE id = $${fields.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM sections WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new SectionRepository();
