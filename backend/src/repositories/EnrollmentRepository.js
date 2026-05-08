const db = require('../config/db');

class EnrollmentRepository {
  async enroll(userId, courseId) {
    const checkQuery = 'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2';
    const checkResult = await db.query(checkQuery, [userId, courseId]);
    if (checkResult.rows.length > 0) throw new Error('Already enrolled');

    const courseQuery = 'SELECT price FROM courses WHERE id = $1';
    const courseResult = await db.query(courseQuery, [courseId]);
    if (courseResult.rows.length === 0) throw new Error('Course not found');
    const price = courseResult.rows[0].price;

    const query = `
      INSERT INTO enrollments (student_id, course_id, status) 
      VALUES ($1, $2, 'active') 
      RETURNING *
    `;
    const result = await db.query(query, [userId, courseId]);

    if (price && parseFloat(price) > 0) {
      const paymentQuery = `
        INSERT INTO payments (student_id, course_id, amount, status, payment_method)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await db.query(paymentQuery, [userId, courseId, price, 'completed', 'system']);
    }

    return result.rows[0];
  }

  async findByUser(userId) {
    const query = `
      SELECT e.*, e.progress, e.created_at, c.title, c.thumbnail, c.type, c.instructor_id 
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND e.status = 'active'
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async checkEnrollment(userId, courseId) {
    const query = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status = 'active'";
    const result = await db.query(query, [userId, courseId]);
    return result.rows[0];
  }
}
module.exports = new EnrollmentRepository();
