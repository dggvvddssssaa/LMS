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
    const completedLessonsQuery = `
        SELECT count(*) as completed FROM lesson_progress lp
        WHERE lp.enrollment_id = $1 AND lp.is_completed = true
    `;

    const [totalRes, completedRes] = await Promise.all([
        db.query(`SELECT count(l.id) as total FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = $1`, [courseId]),
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
    const lessonRes = await db.query(`SELECT l.id FROM lessons l JOIN sections s ON l.section_id = s.id WHERE l.id = $1 AND s.course_id = $2`, [lessonId, courseId]);
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

    // Try generating certificate if conditions met
    let certificate = await this.checkAndIssueCertificate(userId, courseId, enrollmentId, courseProgress.progressPercent);

    return {
        lessonProgress: result.rows[0],
        courseProgress,
        certificate
    };
  }

  async checkAndIssueCertificate(userId, courseId, enrollmentId, progressPercent) {
    if (progressPercent !== 100) return null;

    const courseRes = await db.query('SELECT certificate_enabled, final_assignment_required, final_assignment_pass_percent FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0 || !courseRes.rows[0].certificate_enabled) return null;

    const course = courseRes.rows[0];

    // Check final assignment if required
    if (course.final_assignment_required) {
      const finalAssignRes = await db.query("SELECT id FROM assignments WHERE course_id = $1 AND assignment_scope = 'final' LIMIT 1", [courseId]);
      if (finalAssignRes.rows.length > 0) {
         const finalAssignId = finalAssignRes.rows[0].id;
         const submissionRes = await db.query("SELECT score, status FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2", [finalAssignId, userId]);
         if (submissionRes.rows.length === 0) return null; // Not submitted yet
         
         const sub = submissionRes.rows[0];
         // Depending on how score is calculated. Assume score is percentage (0-100)
         if (sub.score < (course.final_assignment_pass_percent || 80)) return null; 
      }
    }

    // Generate certificate
    const certRes = await db.query('SELECT id, certificate_url FROM certificates WHERE enrollment_id = $1', [enrollmentId]);
    if (certRes.rows.length > 0) return certRes.rows[0];

    const certUrl = `/certificates/${userId}_${courseId}.pdf`; // Mock URL for now
    const newCert = await db.query(
      `INSERT INTO certificates (enrollment_id, user_id, course_id, certificate_url) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [enrollmentId, userId, courseId, certUrl]
    );
    
    // Trigger notification
    const NotificationService = require('./NotificationService');
    await NotificationService.createNotification(
      userId, 
      'Chúc mừng! Bạn đã hoàn thành khóa học và nhận được chứng chỉ mới.', 
      'certificate_earned'
    );
    return newCert.rows[0];
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
