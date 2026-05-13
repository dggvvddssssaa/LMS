const db = require('../config/db');
const { sanitizeUpdateData } = require('../utils/columnWhitelist');

class LessonRepository {
  async create(lessonData) {
    const { section_id, title, content_type, content_url, content_text, video_url, description } = lessonData;
    let { order_index } = lessonData;
    
    if (order_index === undefined || order_index === null) {
      const orderRes = await db.query('SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM lessons WHERE section_id = $1', [section_id]);
      order_index = orderRes.rows[0].next_order;
    }

    const query = `
      INSERT INTO lessons (section_id, title, content_type, content_url, content_text, order_index, video_url, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query(query, [
      section_id, title, content_type || 'video', content_url || null, content_text || null, order_index, video_url || null, description || null
    ]);
    return result.rows[0];
  }

  async findBySectionId(sectionId) {
    const query = `
      SELECT * FROM lessons
      WHERE section_id = $1
      ORDER BY order_index ASC, id ASC
    `;
    const result = await db.query(query, [sectionId]);
    return result.rows;
  }

  async update(id, updateData) {
    updateData = sanitizeUpdateData('lessons', updateData);
    const fields = [];
    const values = [];
    let query = 'UPDATE lessons SET ';

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
    const query = 'DELETE FROM lessons WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async batchUpdateOrder(updates) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const update of updates) {
        const { id, order_index, section_id } = update;
        let queryStr = 'UPDATE lessons SET order_index = $1';
        let params = [order_index];
        if (section_id !== undefined) {
           queryStr += ', section_id = $2';
           params.push(section_id);
        }
        queryStr += ` WHERE id = $${params.length + 1} RETURNING id, order_index, section_id`;
        params.push(id);
        
        const res = await client.query(queryStr, params);
        if (res.rows[0]) results.push(res.rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = new LessonRepository();
