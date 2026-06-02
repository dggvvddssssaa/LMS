const crypto = require('crypto');
const prisma = require('../config/prisma');

const sessionInclude = {
  live_classes: { select: { course_id: true } },
  teacher: { select: { name: true, email: true } }
};

class SessionRepository {
  /**
   * Internal helper: enrich a raw Prisma session record with course data
   * to produce a consistent DTO shape across all query methods.
   */
  async _enrichSession(s) {
    if (!s) return null;
    const course = s.live_classes?.course_id
      ? await prisma.course.findUnique({
          where: { id: s.live_classes.course_id },
          select: { title: true, instructor_id: true, is_published: true, status: true }
        })
      : null;
    return {
      id: s.id,
      live_class_id: s.live_class_id,
      teacher_id: s.teacher_id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      meeting_id: s.meeting_id,
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      join_open_minutes: s.join_open_minutes,
      recording_url: s.recording_url,
      notes: s.notes,
      course_id: s.live_classes?.course_id || null,
      course_title: course?.title || null,
      instructor_id: course?.instructor_id || null,
      is_course_published: course?.is_published || false,
      course_status: course?.status || null,
      teacher_name: s.teacher?.name || null,
      teacher_email: s.teacher?.email || null
    };
  }

  async create({ liveClassId, title, start_time, end_time, teacher_id, join_open_minutes }) {
    const meeting_id = crypto.randomUUID();
    return prisma.sessions.create({
      data: {
        live_class_id: liveClassId ? Number(liveClassId) : null,
        title,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        teacher_id: teacher_id ? Number(teacher_id) : null,
        join_open_minutes: join_open_minutes || 15,
        meeting_id,
        status: 'scheduled'
      }
    });
  }

  async findByLiveClassId(liveClassId) {
    const sessions = await prisma.sessions.findMany({
      where: { live_class_id: Number(liveClassId) },
      include: {
        live_classes: { include: { courses: { select: { id: true, title: true, instructor_id: true } } } },
        teacher: { select: { name: true, email: true } }
      },
      orderBy: { start_time: 'asc' }
    });
    return sessions.map(s => ({
      id: s.id,
      live_class_id: s.live_class_id,
      teacher_id: s.teacher_id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      meeting_id: s.meeting_id,
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      join_open_minutes: s.join_open_minutes,
      course_id: s.live_classes?.courses?.id || null,
      course_title: s.live_classes?.courses?.title || null,
      instructor_id: s.live_classes?.courses?.instructor_id || null,
      teacher_name: s.teacher?.name || null,
      teacher_email: s.teacher?.email || null
    }));
  }

  async findById(id) {
    const s = await prisma.sessions.findUnique({
      where: { id: Number(id) },
      include: sessionInclude
    });
    return this._enrichSession(s);
  }

  async findByMeetingId(meetingId) {
    const s = await prisma.sessions.findFirst({
      where: { meeting_id: meetingId },
      include: sessionInclude
    });
    return this._enrichSession(s);
  }

  async update(id, data) {
    const allowedFields = ['title', 'start_time', 'end_time', 'status', 'teacher_id',
      'opened_at', 'closed_at', 'join_open_minutes', 'recording_url', 'notes'];
    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) cleanData[key] = data[key];
    }
    if (Object.keys(cleanData).length === 0) return null;
    await prisma.sessions.update({
      where: { id: Number(id) },
      data: cleanData
    });
    return this.findById(id);
  }

  async openSession(id) {
    await prisma.sessions.update({
      where: { id: Number(id) },
      data: { status: 'open', opened_at: new Date() }
    });
    return this.findById(id);
  }

  async startSession(id) {
    await prisma.sessions.update({
      where: { id: Number(id) },
      data: { status: 'ongoing' }
    });
    return this.findById(id);
  }

  async endSession(id) {
    await prisma.sessions.update({
      where: { id: Number(id) },
      data: { status: 'ended', closed_at: new Date() }
    });
    return this.findById(id);
  }

  async delete(id) {
    return prisma.sessions.delete({ where: { id: Number(id) }, select: { id: true } });
  }

  async findActiveSessions() {
    const sessions = await prisma.sessions.findMany({
      where: { status: { in: ['scheduled', 'open', 'ongoing'] } },
      include: {
        live_classes: {
          include: {
            courses: {
              select: { id: true, title: true, instructor_id: true, instructor: { select: { name: true, email: true } } }
            }
          }
        },
        teacher: { select: { name: true, email: true } }
      },
      orderBy: { start_time: 'asc' }
    });

    return sessions.map(s => ({
      id: s.id,
      live_class_id: s.live_class_id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      meeting_id: s.meeting_id,
      teacher_id: s.teacher_id,
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      join_open_minutes: s.join_open_minutes,
      course_id: s.live_classes?.courses?.id || null,
      course_title: s.live_classes?.courses?.title || null,
      instructor_id: s.live_classes?.courses?.instructor_id || null,
      instructor_name: s.live_classes?.courses?.instructor?.name || null,
      instructor_email: s.live_classes?.courses?.instructor?.email || null,
      teacher_name: s.teacher?.name || null,
      teacher_email: s.teacher?.email || null
    }));
  }

  async findToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const sessions = await prisma.sessions.findMany({
      where: { start_time: { gte: startOfDay, lt: endOfDay } },
      include: {
        live_classes: { include: { courses: { select: { id: true, title: true, instructor_id: true } } } },
        teacher: { select: { name: true } }
      },
      orderBy: { start_time: 'asc' }
    });

    return sessions.map(s => ({
      id: s.id,
      live_class_id: s.live_class_id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      meeting_id: s.meeting_id,
      teacher_id: s.teacher_id,
      opened_at: s.opened_at,
      join_open_minutes: s.join_open_minutes,
      course_id: s.live_classes?.courses?.id || null,
      course_title: s.live_classes?.courses?.title || null,
      instructor_id: s.live_classes?.courses?.instructor_id || null,
      teacher_name: s.teacher?.name || null
    }));
  }

  async findByTeacherUpcoming(teacherId) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sessions = await prisma.sessions.findMany({
      where: {
        status: { in: ['scheduled', 'open', 'ongoing'] },
        start_time: { gte: now },
        OR: [
          { teacher_id: Number(teacherId) },
          {
            live_classes: {
              courses: { instructor_id: Number(teacherId) }
            }
          }
        ]
      },
      include: {
        live_classes: { include: { courses: { select: { id: true, title: true, instructor_id: true } } } },
        teacher: { select: { name: true } }
      },
      orderBy: { start_time: 'asc' }
    });

    return sessions.map(s => ({
      id: s.id,
      live_class_id: s.live_class_id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      meeting_id: s.meeting_id,
      teacher_id: s.teacher_id,
      opened_at: s.opened_at,
      join_open_minutes: s.join_open_minutes,
      course_id: s.live_classes?.courses?.id || null,
      course_title: s.live_classes?.courses?.title || null,
      instructor_id: s.live_classes?.courses?.instructor_id || null,
      teacher_name: s.teacher?.name || null
    }));
  }

  async recordJoin(sessionId, userId) {
    const existing = await prisma.session_attendance.findFirst({
      where: { session_id: Number(sessionId), student_id: userId, left_at: null },
      orderBy: { joined_at: 'desc' }
    });
    if (existing) return existing;

    return prisma.session_attendance.create({
      data: { session_id: Number(sessionId), student_id: userId, joined_at: new Date() }
    });
  }

  async recordLeave(sessionId, userId) {
    const attendance = await prisma.session_attendance.findFirst({
      where: { session_id: Number(sessionId), student_id: userId, left_at: null }
    });
    if (!attendance) return null;
    return prisma.session_attendance.update({
      where: { id: attendance.id },
      data: { left_at: new Date() }
    });
  }
}

module.exports = new SessionRepository();
