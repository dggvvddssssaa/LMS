const db = require('../config/db');

class QAService {
  async getQuestions(courseId, lessonId) {
    let query = `
      SELECT q.id, q.title, q.content, q.created_at, q.updated_at,
             u.name as author_name, u.role as author_role, u.id as author_id,
             l.title as lesson_title,
             (SELECT count(*) FROM course_answers WHERE question_id = q.id) as answer_count,
             (SELECT count(*) FROM course_answers WHERE question_id = q.id AND is_accepted = true) as accepted_answer_count,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', a.id,
                   'content', a.content,
                   'is_accepted', a.is_accepted,
                   'created_at', a.created_at,
                   'author_name', au.name,
                   'author_role', au.role,
                   'author_id', au.id
                 ) ORDER BY a.is_accepted DESC, a.created_at ASC
               ) FILTER (WHERE a.id IS NOT NULL), '[]'
             ) as answers
      FROM course_questions q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN lessons l ON q.lesson_id = l.id
      LEFT JOIN course_answers a ON q.id = a.question_id
      LEFT JOIN users au ON a.user_id = au.id
      WHERE q.course_id = $1
    `;
    const params = [courseId];

    if (lessonId) {
      query += ` AND q.lesson_id = $2`;
      params.push(lessonId);
    }

    query += ` GROUP BY q.id, u.id, l.title ORDER BY q.created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  async postQuestion(userId, courseId, lessonId, title, content) {
    if (!title || !content) throw new Error('Title and content are required');

    const query = `
      INSERT INTO course_questions (course_id, lesson_id, user_id, title, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(query, [courseId, lessonId || null, userId, title, content]);
    return rows[0];
  }

  async postAnswer(userId, questionId, content) {
    if (!content) throw new Error('Content is required');

    const query = `
      INSERT INTO course_answers (question_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(query, [questionId, userId, content]);
    return rows[0];
  }

  async acceptAnswer(userId, answerId) {
    // Check if the user is the question author or course instructor
    const authQuery = `
      SELECT a.id, q.user_id as question_author_id, c.instructor_id 
      FROM course_answers a
      JOIN course_questions q ON a.question_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE a.id = $1
    `;
    const authRes = await db.query(authQuery, [answerId]);
    if (authRes.rows.length === 0) throw new Error('Answer not found');

    const { question_author_id, instructor_id } = authRes.rows[0];
    if (userId !== question_author_id && userId !== instructor_id) {
      throw new Error('Not authorized to accept this answer');
    }

    // Toggle accept status
    const updateQuery = `
      UPDATE course_answers 
      SET is_accepted = NOT is_accepted, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(updateQuery, [answerId]);
    return rows[0];
  }
}

module.exports = new QAService();
