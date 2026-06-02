const prisma = require('../config/prisma');

class LiveClassRepository {
  async create(liveClassData) {
    const { course_id, schedule_config, total_sessions, max_students, status } = liveClassData;
    
    const existing = await prisma.live_classes.findFirst({
      where: { course_id: Number(course_id) }
    });
    if (existing) return existing;

    return prisma.live_classes.create({
      data: {
        course_id: Number(course_id),
        schedule_config: schedule_config || undefined,
        total_sessions: total_sessions || 0,
        max_students: max_students || 0,
        status: status || 'upcoming'
      }
    });
  }

  async findByCourseId(courseId) {
    const row = await prisma.live_classes.findFirst({
      where: { course_id: Number(courseId) },
      include: {
        courses: { select: { title: true } }
      }
    });
    if (!row) return null;
    const { courses, ...data } = row;
    return { ...data, course_title: courses?.title || null };
  }

  async findActiveRooms() {
    const classes = await prisma.live_classes.findMany({
      where: { status: { in: ['active', 'scheduled'] } },
      include: {
        courses: {
          select: {
            title: true,
            instructor: { select: { name: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return classes.map(lc => ({
      id: lc.id,
      course_id: lc.course_id,
      course_title: lc.courses?.title || null,
      instructor_name: lc.courses?.instructor?.name || null,
      created_at: lc.created_at,
      status: lc.status
    }));
  }

  async findById(id) {
    return prisma.live_classes.findUnique({ where: { id: Number(id) } });
  }

  async update(id, updateData) {
    return prisma.live_classes.update({
      where: { id: Number(id) },
      data: updateData
    });
  }
}

module.exports = new LiveClassRepository();
