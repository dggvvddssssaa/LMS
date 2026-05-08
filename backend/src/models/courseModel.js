const { pool } = require('../utils/db');

class CourseModel {
    static async create({ title, description, teacher_id, thumbnail, type = 'online' }) {
        const result = await pool.query(
            'INSERT INTO courses (title, description, teacher_id, thumbnail, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, teacher_id, thumbnail, type]
        );
        return result.rows[0];
    }

    static async update(id, { title, description, thumbnail, type }) {
        const result = await pool.query(
            'UPDATE courses SET title = $1, description = $2, thumbnail = $3, type = $4 WHERE id = $5 RETURNING *',
            [title, description, thumbnail, type, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        return true;
    }

    static async getAll() {
        const result = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async getByTeacher(teacherId) {
        const result = await pool.query('SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC', [teacherId]);
        return result.rows;
    }
}

class LessonModel {
    static async create({ course_id, title, video_url, order_index }) {
        const result = await pool.query(
            'INSERT INTO lessons (course_id, title, video_url, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
            [course_id, title, video_url, order_index]
        );
        return result.rows[0];
    }

    static async getByCourse(courseId) {
        const result = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC, id ASC', [courseId]);
        return result.rows;
    }

    static async delete(id) {
        await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
        return true;
    }
}

module.exports = { CourseModel, LessonModel };
