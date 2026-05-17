const db = require('../config/db');
const crypto = require('crypto');

class CertificateService {
  async checkEligibility(userId, courseId) {
    // 1. Check enrollment exists
    const enrollCheck = await db.query(
      'SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, userId]
    );
    if (enrollCheck.rows.length === 0) {
      return { eligible: false, message: 'Bạn chưa đăng ký khóa học này' };
    }
    const enrollmentId = enrollCheck.rows[0].id;

    // 2. Check if course has certificate enabled and get settings
    const courseCheck = await db.query(
      `SELECT certificate_enabled, certificate_min_progress, certificate_requires_final_assignment, certificate_pass_percent 
       FROM courses WHERE id = $1`,
      [courseId]
    );
    if (courseCheck.rows.length === 0 || !courseCheck.rows[0].certificate_enabled) {
      return { eligible: false, message: 'Khóa học này không hỗ trợ cấp chứng chỉ.' };
    }
    const settings = courseCheck.rows[0];

    // 3. Check progress
    const progressCheck = await db.query(
      `SELECT COUNT(DISTINCT l.id) as total_lessons,
              COUNT(DISTINCT lp.lesson_id) as completed_lessons
       FROM sections s
       JOIN lessons l ON l.section_id = s.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = $3 AND lp.is_completed = true
       WHERE s.course_id = $1`,
      [courseId, userId, enrollmentId]
    );

    const { total_lessons, completed_lessons } = progressCheck.rows[0];
    const totalInt = parseInt(total_lessons);
    const completedInt = parseInt(completed_lessons);
    
    let progressPercent = 0;
    if (totalInt > 0) {
      progressPercent = (completedInt / totalInt) * 100;
    } else {
      progressPercent = 100; // No lessons means 100% complete
    }

    const minProgress = settings.certificate_min_progress || 100;
    if (progressPercent < minProgress) {
      return { 
        eligible: false, 
        message: `Bạn mới hoàn thành ${Math.round(progressPercent)}% (${completedInt}/${totalInt} bài học). Cần hoàn thành tối thiểu ${minProgress}% để nhận chứng chỉ.` 
      };
    }

    // 4. Check final assignment if required
    if (settings.certificate_requires_final_assignment) {
      const passPercent = settings.certificate_pass_percent || 80;
      const assignmentCheck = await db.query(
        `SELECT a.id, s.score, s.status, a.score_max
         FROM assignments a
         LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $2
         WHERE a.course_id = $1 AND a.assignment_scope = 'final'
         ORDER BY a.created_at DESC LIMIT 1`,
        [courseId, userId]
      );
      
      if (assignmentCheck.rows.length === 0) {
        return { eligible: false, message: 'Khóa học này yêu cầu bài kiểm tra cuối khóa nhưng chưa có bài kiểm tra nào được cấu hình.' };
      }
      
      const finalA = assignmentCheck.rows[0];
      if (!finalA.status || (finalA.status !== 'graded' && finalA.status !== 'passed')) {
        return { eligible: false, message: 'Bạn chưa hoàn thành hoặc chưa được chấm điểm bài kiểm tra cuối khóa (chưa đạt).' };
      }
      
      const actualPercent = (finalA.score / (finalA.score_max || 100)) * 100;
      if (actualPercent < passPercent) {
        return { eligible: false, message: `Điểm bài kiểm tra cuối khóa của bạn là ${actualPercent}%. Cần đạt tối thiểu ${passPercent}%.` };
      }
    }

    // 5. Check if certificate already exists
    const existingCert = await db.query(
      'SELECT id, certificate_code FROM certificates WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (existingCert.rows.length > 0) {
      return { eligible: true, alreadyIssued: true, certificateId: existingCert.rows[0].id };
    }

    return { eligible: true, enrollmentId };
  }

  generateCertificateCode(userId, courseId) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `LMS-${courseId}-${userId}-${randomHex}`;
  }

  async issueCertificate(userId, courseId) {
    const eligibility = await this.checkEligibility(userId, courseId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.message);
    }
    
    if (eligibility.alreadyIssued) {
      return await this.getCertificateDetails(eligibility.certificateId);
    }

    // Get snapshot data
    const snapshotQuery = await db.query(
      `SELECT u.name as student_name, u.email as student_email,
              c.title as course_title, c.certificate_template_id,
              i.name as instructor_name
       FROM users u, courses c
       LEFT JOIN users i ON c.instructor_id = i.id
       WHERE u.id = $1 AND c.id = $2`,
      [userId, courseId]
    );
    
    const snap = snapshotQuery.rows[0];
    const code = this.generateCertificateCode(userId, courseId);
    const verifyUrl = `/verify-certificate/${code}`;
    const issuedDateText = new Date().toLocaleDateString('vi-VN');

    // Insert certificate
    const insertResult = await db.query(
      `INSERT INTO certificates (
        certificate_code, enrollment_id, user_id, course_id, template_id,
        student_name_snapshot, student_email_snapshot, course_title_snapshot,
        instructor_name_snapshot, issued_date_text, verify_url, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        code, eligibility.enrollmentId, userId, courseId, snap.certificate_template_id,
        snap.student_name, snap.student_email, snap.course_title,
        snap.instructor_name, issuedDateText, verifyUrl, 'issued'
      ]
    );

    return await this.getCertificateDetails(insertResult.rows[0].id);
  }

  async getCertificateDetails(certId) {
    const { rows } = await db.query(
      `SELECT c.*, t.layout_json, t.background_url, t.logo_url, t.seal_url, t.signature_url,
              t.issuer_name, t.issuer_title, t.representative_name, t.representative_title
       FROM certificates c
       LEFT JOIN certificate_templates t ON c.template_id = t.id
       WHERE c.id = $1`,
      [certId]
    );
    return rows[0];
  }
}

module.exports = new CertificateService();
