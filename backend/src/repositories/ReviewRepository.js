const prisma = require('../config/prisma');

class ReviewRepository {
  async findByCourse(courseId) {
    return prisma.reviews.findMany({
      where: { course_id: parseInt(courseId, 10) },
      include: {
        users: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findByUserAndCourse(userId, courseId) {
    return prisma.reviews.findUnique({
      where: { course_id_student_id: { course_id: parseInt(courseId, 10), student_id: userId } }
    });
  }

  async create(userId, courseId, rating, comment) {
    return prisma.reviews.create({
      data: {
        student_id: userId,
        course_id: parseInt(courseId, 10),
        rating,
        comment
      }
    });
  }

  async update(userId, courseId, rating, comment) {
    return prisma.reviews.update({
      where: { course_id_student_id: { course_id: parseInt(courseId, 10), student_id: userId } },
      data: { rating, comment }
    });
  }

  async delete(userId, courseId) {
    return prisma.reviews.delete({
      where: { course_id_student_id: { course_id: parseInt(courseId, 10), student_id: userId } }
    });
  }

  async getAverageRating(courseId) {
    const result = await prisma.reviews.aggregate({
      where: { course_id: parseInt(courseId, 10) },
      _avg: { rating: true },
      _count: true
    });
    return { average: result._avg.rating || 0, count: result._count };
  }
}

module.exports = new ReviewRepository();
