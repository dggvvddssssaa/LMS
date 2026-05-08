const db = require('../config/db');

class CategoryRepository {
  async getAll() {
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  }

  async create(data) {
    const { name, slug } = data;
    const result = await db.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    return result.rows[0];
  }

  async setCourseCategories(courseId, categoryIds) {
    // Delete existing
    await db.query('DELETE FROM course_categories WHERE course_id = $1', [courseId]);
    if (categoryIds && categoryIds.length > 0) {
      const values = categoryIds.map((catId, index) => `($1, $${index + 2})`).join(', ');
      const params = [courseId, ...categoryIds];
      await db.query(`INSERT INTO course_categories (course_id, category_id) VALUES ${values}`, params);
    }
  }

  async getCourseCategories(courseId) {
    const result = await db.query(`
      SELECT c.* FROM categories c
      JOIN course_categories cc ON c.id = cc.category_id
      WHERE cc.course_id = $1
    `, [courseId]);
    return result.rows;
  }
}

module.exports = new CategoryRepository();
