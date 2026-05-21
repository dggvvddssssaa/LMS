const prisma = require('../config/prisma');

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByIdWithPassword(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true, is_verified: true, created_at: true }
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true, is_verified: true, created_at: true }
    });
  }

  async create(user) {
    const { name, email, password, role } = user;
    return prisma.user.create({
      data: { name, email, password, role: role || 'student' },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true, is_verified: true, created_at: true }
    });
  }

  async updateVerification(id, isVerified) {
    return prisma.user.update({
      where: { id },
      data: { is_verified: isVerified },
      select: { id: true, name: true, email: true, role: true, is_verified: true }
    });
  }

  async updateRoleAndVerification(id, role, isVerified) {
    return prisma.user.update({
      where: { id },
      data: { role, is_verified: isVerified },
      select: { id: true, name: true, email: true, role: true, is_verified: true }
    });
  }

  async findAllUsers() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true, is_verified: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getUserDetails(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, is_verified: true, created_at: true }
    });
    if (!user) return null;

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: userId },
      select: {
        id: true,
        status: true,
        enrolled_at: true,
        course: { select: { id: true, title: true, type: true } }
      },
      orderBy: { enrolled_at: 'desc' }
    });

    const payments = await prisma.payment.findMany({
      where: { student_id: userId },
      select: { course_id: true, amount: true, status: true }
    });

    const paymentMap = {};
    for (const p of payments) {
      paymentMap[p.course_id] = p;
    }

    user.enrolled_courses = enrollments.map(e => ({
      id: e.course.id,
      title: e.course.title,
      type: e.course.type,
      enrollment_status: e.status,
      enrolled_at: e.enrolled_at,
      payment_amount: paymentMap[e.course.id]?.amount || null,
      payment_status: paymentMap[e.course.id]?.status || null
    }));

    return user;
  }

  async deleteById(id) {
    return prisma.user.delete({ where: { id }, select: { id: true } });
  }
}

module.exports = new UserRepository();
