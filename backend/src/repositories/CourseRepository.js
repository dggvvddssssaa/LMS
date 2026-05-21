const prisma = require('../config/prisma');

class CourseRepository {
  async create(courseData) {
    const {
      title, description, instructor_id, thumbnail, type, price, is_published,
      sale_price, duration_total_minutes, video_count, what_you_will_learn,
      slug, short_description, full_description, promo_video_url, language,
      certificate_enabled, tags, level
    } = courseData;

    return prisma.course.create({
      data: {
        title,
        description: description || null,
        instructor_id: instructor_id || null,
        thumbnail: thumbnail || null,
        type: type || 'video',
        price: price || 0,
        is_published: is_published || false,
        sale_price: sale_price || 0,
        duration_total_minutes: duration_total_minutes || 0,
        video_count: video_count || 0,
        what_you_will_learn: what_you_will_learn || [],
        slug: slug || null,
        short_description: short_description || null,
        full_description: full_description || null,
        promo_video_url: promo_video_url || null,
        language: language || 'vi',
        certificate_enabled: certificate_enabled || false,
        tags: tags || [],
        level: level || 'beginner'
      }
    });
  }

  async findById(id) {
    return prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        instructor: { select: { name: true } }
      }
    });
  }

  async findBySlug(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.id = { not: Number(excludeId) };
    }
    return prisma.course.findFirst({
      where,
      select: { id: true, slug: true }
    });
  }

  async findAll(filters = {}) {
    const where = {};
    const allowedSortFields = ['created_at', 'title', 'price', 'updated_at'];

    if (filters.type) where.type = filters.type;
    if (filters.is_published !== undefined) where.is_published = filters.is_published;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.instructor_id) where.instructor_id = Number(filters.instructor_id);

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const sortField = allowedSortFields.includes(filters.sort) ? filters.sort : 'created_at';
    const sortDir = filters.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: { instructor: { select: { name: true } } },
        orderBy: { [sortField]: sortDir },
        skip,
        take: limit
      }),
      prisma.course.count({ where })
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async update(id, updateData) {
    return prisma.course.update({
      where: { id: Number(id) },
      data: { ...updateData, updated_at: new Date() }
    });
  }

  async delete(id) {
    return prisma.course.delete({ where: { id: Number(id) }, select: { id: true } });
  }
}

module.exports = new CourseRepository();
