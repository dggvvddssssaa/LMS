const db = require('../config/db');

class AssignmentRepository {
  async getByLesson(lessonId) {
    const query = `
      SELECT * FROM assignments
      WHERE lesson_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [lessonId]);
    return result.rows;
  }

  async getById(id) {
    const query = 'SELECT * FROM assignments WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(data) {
    const { lesson_id, course_id, title, description, deadline, kind, payload, score_max } = data;
    const query = `
      INSERT INTO assignments (lesson_id, course_id, title, description, deadline, kind, payload, score_max)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query(query, [
      lesson_id, course_id, title, description, deadline || null, kind || 'mcq', payload ? JSON.stringify(payload) : null, score_max || 100
    ]);
    return result.rows[0];
  }

  async update(id, data) {
    const { title, description, deadline, kind, payload, score_max } = data;
    const query = `
      UPDATE assignments
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          deadline = COALESCE($3, deadline),
          kind = COALESCE($4, kind),
          payload = COALESCE($5, payload),
          score_max = COALESCE($6, score_max)
      WHERE id = $7
      RETURNING *
    `;
    const result = await db.query(query, [
      title, description, deadline, kind, payload ? JSON.stringify(payload) : null, score_max, id
    ]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM assignments WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async submitAssignment(data) {
    const { assignment_id, student_id, answers, score, status } = data;
    
    // Check if submission already exists
    const checkQuery = 'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2';
    const checkResult = await db.query(checkQuery, [assignment_id, student_id]);
    
    if (checkResult.rows.length > 0) {
      // Update existing
      const updateQuery = `
        UPDATE assignment_submissions
        SET answers = $1, score = $2, status = $3, created_at = NOW()
        WHERE assignment_id = $4 AND student_id = $5
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [
        answers ? JSON.stringify(answers) : null, score || 0, status || 'submitted', assignment_id, student_id
      ]);
      return updateResult.rows[0];
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO assignment_submissions (assignment_id, student_id, answers, score, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const insertResult = await db.query(insertQuery, [
        assignment_id, student_id, answers ? JSON.stringify(answers) : null, score || 0, status || 'submitted'
      ]);
      return insertResult.rows[0];
    }
  }
  
  async getSubmission(assignmentId, studentId) {
    const query = 'SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2';
    const result = await db.query(query, [assignmentId, studentId]);
    return result.rows[0];
  }
}

module.exports = new AssignmentRepository();
