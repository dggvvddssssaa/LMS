const db = require('../config/db');
const { sanitizeUpdateData } = require('../utils/columnWhitelist');

class CourseRepository {
  async create(courseData, client) {
    const queryRunner = client || db;
    const { 
      title, description, instructor_id, thumbnail, type, price, is_published,
      sale_price, duration_total_minutes, video_count, what_you_will_learn,
      slug, short_description, full_description, promo_video_url, language, certificate_enabled, tags, level
    } = courseData;
    const query = `
      INSERT INTO courses (
        title, description, instructor_id, thumbnail, type, price, is_published,
        sale_price, duration_total_minutes, video_count, what_you_will_learn,
        slug, short_description, full_description, promo_video_url, language, certificate_enabled, tags, level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    const result = await queryRunner.query(query, [
      title, description, instructor_id, thumbnail, type, price || 0, is_published || false,
      sale_price || 0, duration_total_minutes || 0, video_count || 0, what_you_will_learn || [],
      slug || null, short_description || null, full_description || null, promo_video_url || null,
      language || 'vi', certificate_enabled || false, tags || [], level || 'beginner'
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

  async findBySlug(slug, excludeId = null) {
    let query = `SELECT id, slug FROM courses WHERE slug = $1`;
    const params = [slug];
    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }
    const result = await db.query(query, params);
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

    if (filters.search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.instructor_id) {
      query += ` AND c.instructor_id = $${paramIndex++}`;
      params.push(filters.instructor_id);
    }

    // Count before pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) sub`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Sorting
    const sortField = filters.sort || 'created_at';
    const sortDir = filters.order === 'asc' ? 'ASC' : 'DESC';
    const allowedSortFields = ['created_at', 'title', 'price', 'updated_at'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    query += ` ORDER BY c.${safeSortField} ${sortDir}`;

    // Pagination
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return {
      data: result.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    query += fields.join(', ') + `, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`;
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
