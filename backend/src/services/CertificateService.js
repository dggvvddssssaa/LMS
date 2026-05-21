const prisma = require('../config/prisma');
const crypto = require('crypto');

class CertificateService {
  async checkEligibility(userId, courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: userId, course_id: Number(courseId) } },
      select: { id: true }
    });
    if (!enrollment) {
      return { eligible: false, message: 'Bạn chưa đăng ký khóa học này' };
    }

    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: {
        certificate_enabled: true,
        certificate_min_progress: true,
        certificate_requires_final_assignment: true,
        certificate_pass_percent: true
      }
    });
    if (!course || !course.certificate_enabled) {
      return { eligible: false, message: 'Khóa học này không hỗ trợ cấp chứng chỉ.' };
    }

    const [completedCount, totalLessons] = await Promise.all([
      prisma.lesson_progress.count({
        where: { enrollment_id: enrollment.id, is_completed: true }
      }),
      prisma.lesson.count({
        where: { section: { course_id: Number(courseId) } }
      })
    ]);

    const totalInt = totalLessons;
    const completedInt = completedCount;
    const progressPercent = totalInt > 0 ? (completedInt / totalInt) * 100 : 100;

    const minProgress = course.certificate_min_progress || 100;
    if (progressPercent < minProgress) {
      return {
        eligible: false,
        message: `Bạn mới hoàn thành ${Math.round(progressPercent)}% (${completedInt}/${totalInt} bài học). Cần hoàn thành tối thiểu ${minProgress}% để nhận chứng chỉ.`
      };
    }

    if (course.certificate_requires_final_assignment) {
      const passPercent = course.certificate_pass_percent || 80;
      const finalAssignment = await prisma.assignments.findFirst({
        where: { course_id: Number(courseId), assignment_scope: 'final' },
        orderBy: { created_at: 'desc' },
        select: { id: true, score_max: true }
      });

      if (!finalAssignment) {
        return { eligible: false, message: 'Khóa học này yêu cầu bài kiểm tra cuối khóa nhưng chưa có bài kiểm tra nào được cấu hình.' };
      }

      const submission = await prisma.assignment_submissions.findFirst({
        where: { assignment_id: finalAssignment.id, student_id: userId },
        select: { score: true, status: true }
      });

      if (!submission || (submission.status !== 'graded' && submission.status !== 'passed')) {
        return { eligible: false, message: 'Bạn chưa hoàn thành hoặc chưa được chấm điểm bài kiểm tra cuối khóa (chưa đạt).' };
      }

      const actualPercent = (submission.score / (finalAssignment.score_max || 100)) * 100;
      if (actualPercent < passPercent) {
        return { eligible: false, message: `Điểm bài kiểm tra cuối khóa của bạn là ${actualPercent}%. Cần đạt tối thiểu ${passPercent}%.` };
      }
    }

    const existingCert = await prisma.certificates.findFirst({
      where: { course_id: Number(courseId), user_id: userId },
      select: { id: true }
    });
    if (existingCert) {
      return { eligible: true, alreadyIssued: true, certificateId: existingCert.id };
    }

    return { eligible: true, enrollmentId: enrollment.id };
  }

  generateCertificateCode(userId, courseId) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `LMS-${courseId}-${userId}-${randomHex}`;
  }

  async issueCertificate(userId, courseId) {
    const eligibility = await this.checkEligibility(userId, courseId);
    if (!eligibility.eligible) throw new Error(eligibility.message);
    if (eligibility.alreadyIssued) return this.getCertificateDetails(eligibility.certificateId);

    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.course.findUnique({
        where: { id: Number(courseId) },
        select: { title: true, certificate_template_id: true, instructor: { select: { name: true } } }
      })
    ]);

    const code = this.generateCertificateCode(userId, courseId);
    const verifyUrl = `/verify-certificate/${code}`;
    const issuedDateText = new Date().toLocaleDateString('vi-VN');

    const result = await prisma.certificates.create({
      data: {
        certificate_code: code,
        enrollment_id: eligibility.enrollmentId,
        user_id: userId,
        course_id: Number(courseId),
        template_id: course?.certificate_template_id || null,
        student_name_snapshot: user?.name || null,
        student_email_snapshot: user?.email || null,
        course_title_snapshot: course?.title || null,
        instructor_name_snapshot: course?.instructor?.name || null,
        issued_date_text: issuedDateText,
        verify_url: verifyUrl,
        status: 'issued'
      }
    });

    return this.getCertificateDetails(result.id);
  }

  async getCertificateDetails(certId) {
    const cert = await prisma.certificates.findUnique({
      where: { id: Number(certId) }
    });
    if (!cert) return null;

    if (cert.template_id) {
      const template = await prisma.certificate_templates.findUnique({
        where: { id: cert.template_id }
      });
      if (template) {
        cert.layout_json = template.layout_json;
        cert.background_url = template.background_url;
        cert.logo_url = template.logo_url;
        cert.seal_url = template.seal_url;
        cert.signature_url = template.signature_url;
        cert.issuer_name = template.issuer_name;
        cert.issuer_title = template.issuer_title;
        cert.representative_name = template.representative_name;
        cert.representative_title = template.representative_title;
      }
    }

    return cert;
  }
}

module.exports = new CertificateService();
