const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(user) {
    const { name, email, password, role } = user;
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, is_verified, created_at
    `;
    const result = await db.query(query, [name, email, password, role]);
    return result.rows[0];
  }

  async updateVerification(id, isVerified) {
    const query = `
      UPDATE users SET is_verified = $1
      WHERE id = $2 RETURNING id, name, email, role, is_verified
    `;
    const result = await db.query(query, [isVerified, id]);
    return result.rows[0];
  }

  async updateRoleAndVerification(id, role, isVerified) {
    const query = `
      UPDATE users SET role = $1, is_verified = $2
      WHERE id = $3 RETURNING id, name, email, role, is_verified
    `;
    const result = await db.query(query, [role, isVerified, id]);
    return result.rows[0];
  }

  async findAllUsers() {
    const query = 'SELECT id, name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  async getUserDetails(userId) {
    // 1. Get basic user info
    const userQuery = 'SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);
    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    // 2. Get enrolled courses + payment info
    const coursesQuery = `
      SELECT c.id, c.title, c.type, e.status as enrollment_status, e.enrolled_at,
             p.amount as payment_amount, p.status as payment_status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN payments p ON p.course_id = c.id AND p.student_id = e.student_id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `;
    const coursesResult = await db.query(coursesQuery, [userId]);
    
    // 3. Attach courses to user object
    user.enrolled_courses = coursesResult.rows;
    return user;
  }

  async deleteById(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
