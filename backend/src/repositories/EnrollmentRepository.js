const prisma = require('../config/prisma');

class EnrollmentRepository {
  async enroll(userId, courseId) {
    const check = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: userId, course_id: Number(courseId) } }
    });
    if (check) throw new Error('Already enrolled');

    const course = await prisma.course.findUnique({ where: { id: Number(courseId) }, select: { price: true } });
    if (!course) throw new Error('Course not found');

    const enrollment = await prisma.enrollment.create({
      data: { student_id: userId, course_id: Number(courseId), status: 'active' }
    });

    const price = parseFloat(course.price);
    if (price > 0) {
      await prisma.payment.create({
        data: {
          student_id: userId,
          course_id: Number(courseId),
          amount: price,
          status: 'completed',
          payment_method: 'system'
        }
      });
    }

    return enrollment;
  }

  async findByUser(userId) {
    return prisma.enrollment.findMany({
      where: { student_id: userId, status: 'active' },
      select: {
        id: true,
        progress: true,
        created_at: true,
        enrolled_at: true,
        course: { select: { id: true, title: true, thumbnail: true, type: true, instructor_id: true } }
      }
    });
  }

  async checkEnrollment(userId, courseId) {
    return prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: userId, course_id: Number(courseId) } }
    });
  }
}

module.exports = new EnrollmentRepository();
