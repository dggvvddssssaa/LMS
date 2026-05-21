const prisma = require('../config/prisma');

class MaterialRepository {
  async findByCourseId(courseId) {
    return prisma.course_materials.findMany({
      where: { course_id: Number(courseId) },
      orderBy: { created_at: 'desc' }
    });
  }

  async create(data) {
    return prisma.course_materials.create({
      data: {
        course_id: Number(data.course_id),
        title: data.title,
        file_url: data.file_url,
        file_type: data.file_type || 'document'
      }
    });
  }

  async delete(id) {
    return prisma.course_materials.delete({
      where: { id: Number(id) },
      select: { id: true }
    });
  }
}

module.exports = new MaterialRepository();
