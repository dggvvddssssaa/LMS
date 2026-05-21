const prisma = require('../config/prisma');

class LessonRepository {
  async create(lessonData) {
    const { section_id, title, content_type, content_url, content_text, video_url, description, order_index } = lessonData;

    let orderIdx = order_index;
    if (orderIdx === undefined || orderIdx === null) {
      const last = await prisma.lesson.findFirst({
        where: { section_id },
        orderBy: { order_index: 'desc' },
        select: { order_index: true }
      });
      orderIdx = (last?.order_index ?? -1) + 1;
    }

    return prisma.lesson.create({
      data: {
        section_id,
        title,
        content_type: content_type || 'video',
        content_url: content_url || null,
        content_text: content_text || null,
        video_url: video_url || null,
        description: description || null,
        order_index: orderIdx
      }
    });
  }

  async findBySectionId(sectionId) {
    return prisma.lesson.findMany({
      where: { section_id: Number(sectionId) },
      orderBy: [{ order_index: 'asc' }, { id: 'asc' }]
    });
  }

  async update(id, updateData) {
    return prisma.lesson.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async delete(id) {
    return prisma.lesson.delete({ where: { id: Number(id) }, select: { id: true } });
  }

  async batchUpdateOrder(updates) {
    return prisma.$transaction(
      updates.map(u =>
        prisma.lesson.update({
          where: { id: Number(u.id) },
          data: {
            order_index: u.order_index,
            ...(u.section_id !== undefined ? { section_id: u.section_id } : {})
          },
          select: { id: true, order_index: true, section_id: true }
        })
      )
    );
  }
}

module.exports = new LessonRepository();
