const prisma = require('../config/prisma');

class SectionRepository {
  async create(sectionData) {
    const { course_id, title, order_index } = sectionData;
    return prisma.section.create({
      data: { course_id: Number(course_id), title, order_index: order_index || 0 }
    });
  }

  async batchUpdateOrder(updates) {
    return prisma.$transaction(
      updates.map(u =>
        prisma.section.update({
          where: { id: Number(u.id) },
          data: { order_index: u.order_index }
        })
      )
    );
  }

  async findByCourseId(courseId) {
    return prisma.section.findMany({
      where: { course_id: Number(courseId) },
      orderBy: [{ order_index: 'asc' }, { id: 'asc' }]
    });
  }

  async update(id, updateData) {
    return prisma.section.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async delete(id) {
    return prisma.section.delete({ where: { id: Number(id) }, select: { id: true } });
  }
}

module.exports = new SectionRepository();
