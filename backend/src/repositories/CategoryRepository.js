const prisma = require('../config/prisma');

class CategoryRepository {
  async getAll() {
    return prisma.categories.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data) {
    return prisma.categories.create({ data });
  }

  async setCourseCategories(courseId, categoryIds) {
    const cid = Number(courseId);
    await prisma.course_categories.deleteMany({ where: { course_id: cid } });
    if (categoryIds && categoryIds.length > 0) {
      await prisma.course_categories.createMany({
        data: categoryIds.map(catId => ({ course_id: cid, category_id: Number(catId) }))
      });
    }
  }

  async getCourseCategories(courseId) {
    const rows = await prisma.course_categories.findMany({
      where: { course_id: Number(courseId) },
      include: { categories: true }
    });
    return rows.map(r => r.categories).filter(Boolean);
  }
}

module.exports = new CategoryRepository();
