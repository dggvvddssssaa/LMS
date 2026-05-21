const prisma = require('../config/prisma');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

class ProgressService {
  async _getEnrollment(userId, courseId) {
    const enrollment = await EnrollmentRepository.checkEnrollment(userId, courseId);
    if (!enrollment) throw new Error('Not enrolled in this course');
    return enrollment;
  }

  async _updateCourseProgress(enrollmentId, courseId) {
    const [total, completed] = await Promise.all([
      prisma.lesson.count({
        where: { section: { course_id: Number(courseId) } }
      }),
      prisma.lesson_progress.count({
        where: { enrollment_id: enrollmentId, is_completed: true }
      })
    ]);

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress: progressPercent }
    });

    return { progressPercent, total, completed };
  }

  async markComplete(userId, courseId, lessonId, isCompleted) {
    const enrollment = await this._getEnrollment(userId, courseId);

    const lesson = await prisma.lesson.findFirst({
      where: { id: Number(lessonId), section: { course_id: Number(courseId) } },
      select: { id: true }
    });
    if (!lesson) throw new Error('Lesson not found in this course');

    const lessonProgress = await prisma.lesson_progress.upsert({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: Number(lessonId) } },
      create: { enrollment_id: enrollment.id, lesson_id: Number(lessonId), is_completed: isCompleted },
      update: { is_completed: isCompleted, updated_at: new Date() }
    });

    const courseProgress = await this._updateCourseProgress(enrollment.id, courseId);
    let certificate = await this.checkAndIssueCertificate(userId, courseId, enrollment.id, courseProgress.progressPercent);

    return { lessonProgress, courseProgress, certificate };
  }

  async checkAndIssueCertificate(userId, courseId, enrollmentId, progressPercent) {
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: {
        certificate_enabled: true,
        certificate_min_progress: true,
        certificate_requires_final_assignment: true,
        certificate_pass_percent: true
      }
    });

    if (!course || !course.certificate_enabled) return null;
    if (progressPercent < (course.certificate_min_progress ?? 100)) return null;

    if (course.certificate_requires_final_assignment) {
      const finalAssignment = await prisma.assignments.findFirst({
        where: { course_id: Number(courseId), assignment_scope: 'final' }
      });

      if (finalAssignment) {
        const submission = await prisma.assignment_submissions.findFirst({
          where: { assignment_id: finalAssignment.id, student_id: userId }
        });
        if (!submission) return null;

        const isPassed = submission.status === 'passed' || submission.status === 'graded';
        if (!isPassed && submission.score < (course.certificate_pass_percent || 80)) return null;
      }
    }

    const existing = await prisma.certificates.findFirst({
      where: { enrollment_id: enrollmentId }
    });
    if (existing) return existing;

    const newCert = await prisma.certificates.create({
      data: {
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: Number(courseId),
        certificate_url: `/certificates/${userId}_${courseId}.pdf`
      }
    });

    const NotificationService = require('./NotificationService');
    await NotificationService.createNotification(
      userId,
      'Chúc mừng! Bạn đã hoàn thành khóa học và nhận được chứng chỉ mới.',
      'certificate_earned'
    );

    return newCert;
  }

  async savePosition(userId, courseId, lessonId, lastPosition) {
    const enrollment = await this._getEnrollment(userId, courseId);

    return prisma.lesson_progress.upsert({
      where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: Number(lessonId) } },
      create: { enrollment_id: enrollment.id, lesson_id: Number(lessonId), last_position: lastPosition },
      update: { last_position: lastPosition, updated_at: new Date() }
    });
  }

  async getCourseProgress(userId, courseId) {
    const enrollment = await this._getEnrollment(userId, courseId);

    const rows = await prisma.lesson_progress.findMany({
      where: { enrollment_id: enrollment.id },
      select: { lesson_id: true, is_completed: true, last_position: true, updated_at: true }
    });

    const progressMap = {};
    rows.forEach(row => {
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
