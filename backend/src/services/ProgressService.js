const db = require('../config/db');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

class ProgressService {
  async _getEnrollment(userId, courseId) {
    const enrollment = await EnrollmentRepository.checkEnrollment(userId, courseId);
    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }
    return enrollment;
  }

  async _updateCourseProgress(enrollmentId, courseId) {
    // Calculate total lessons and completed lessons
    const totalLessonsQuery = `
        SELECT count(*) as total FROM lessons l
        JOIN sections s ON l.section_id = s.id OR l.course_id = $1
        WHERE l.course_id = $1
    `;
    // F8 style schema uses course_id directly in lessons.
    const completedLessonsQuery = `
        SELECT count(*) as completed FROM lesson_progress lp
        WHERE lp.enrollment_id = $1 AND lp.is_completed = true
    `;

    const [totalRes, completedRes] = await Promise.all([
        db.query(`SELECT count(*) as total FROM lessons WHERE course_id = $1`, [courseId]),
        db.query(completedLessonsQuery, [enrollmentId])
    ]);

    const total = parseInt(totalRes.rows[0].total) || 0;
    const completed = parseInt(completedRes.rows[0].completed) || 0;
    
    let progressPercent = 0;
    if (total > 0) {
        progressPercent = Math.round((completed / total) * 100);
    }

    // Update enrollment progress
    await db.query(
        `UPDATE enrollments SET progress = $1 WHERE id = $2`,
        [progressPercent, enrollmentId]
    );

    return { progressPercent, total, completed };
  }

  async markComplete(userId, courseId, lessonId, isCompleted) {
    const enrollment = await this._getEnrollment(userId, courseId);
    const enrollmentId = enrollment.id;

    // Verify lesson belongs to course
    const lessonRes = await db.query(`SELECT id FROM lessons WHERE id = $1 AND course_id = $2`, [lessonId, courseId]);
    if (lessonRes.rows.length === 0) {
        throw new Error('Lesson not found in this course');
    }

    // Upsert lesson_progress
    const query = `
      INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (enrollment_id, lesson_id) 
      DO UPDATE SET is_completed = EXCLUDED.is_completed, updated_at = NOW()
      RETURNING *
    `;
    const result = await db.query(query, [enrollmentId, lessonId, isCompleted]);

    // Recalculate total course progress
    const courseProgress = await this._updateCourseProgress(enrollmentId, courseId);

    // If completed 100%, check and generate certificate
    let certificate = null;
    if (courseProgress.progressPercent === 100) {
      // Check if certificate already exists
      const certRes = await db.query('SELECT id FROM certificates WHERE enrollment_id = $1', [enrollmentId]);
      if (certRes.rows.length === 0) {
          // Generate new certificate
          const certUrl = `/certificates/${userId}_${courseId}.pdf`; // Mock URL for now
          const newCert = await db.query(
            `INSERT INTO certificates (enrollment_id, user_id, course_id, certificate_url) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [enrollmentId, userId, courseId, certUrl]
          );
          certificate = newCert.rows[0];
          
          // Trigger notification
          const NotificationService = require('./NotificationService');
          await NotificationService.createNotification(
            userId, 
            'Chúc mừng! Bạn đã hoàn thành khóa học và nhận được chứng chỉ mới.', 
            'certificate_earned'
          );
      }
    }

    return {
        lessonProgress: result.rows[0],
        courseProgress,
        certificate
    };
  }

  async savePosition(userId, courseId, lessonId, lastPosition) {
    const enrollment = await this._getEnrollment(userId, courseId);
    
    // Upsert lesson_progress for position
    const query = `
      INSERT INTO lesson_progress (enrollment_id, lesson_id, last_position, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (enrollment_id, lesson_id) 
      DO UPDATE SET last_position = EXCLUDED.last_position, updated_at = NOW()
      RETURNING *
    `;
    const result = await db.query(query, [enrollment.id, lessonId, lastPosition]);
    
    return result.rows[0];
  }

  async getCourseProgress(userId, courseId) {
    const enrollment = await this._getEnrollment(userId, courseId);
    
    const query = `
      SELECT lesson_id, is_completed, last_position, updated_at
      FROM lesson_progress
      WHERE enrollment_id = $1
    `;
    
    const result = await db.query(query, [enrollment.id]);
    
    // Convert to map for easy frontend lookup
    const progressMap = {};
    result.rows.forEach(row => {
        progressMap[row.lesson_id] = {
            isCompleted: row.is_completed,
            lastPosition: row.last_position,
            updatedAt: row.updated_at
        };
    });
    
    return {
        enrollmentId: enrollment.id,
        overallProgress: parseFloat(enrollment.progress) || 0,
        lessons: progressMap
    };
  }
}

module.exports = new ProgressService();
