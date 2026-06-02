const prisma = require('../config/prisma');
const SessionRepository = require('../repositories/SessionRepository');
const NotificationService = require('./NotificationService');
const { hasRole } = require('../utils/roles');

class SessionService {
  async createSession(sessionData) {
    const { liveClassId, live_class_id, title, start_time, end_time, teacher_id, join_open_minutes } = sessionData;
    const lcId = liveClassId || live_class_id;
    if (!lcId || !title || !start_time) {
      throw new Error('Missing required session data (liveClassId, title, start_time)');
    }

    // Auto-resolve teacher_id from course instructor if not provided
    let resolvedTeacherId = teacher_id || null;
    if (!resolvedTeacherId && lcId) {
      try {
        const liveClass = await prisma.live_classes.findUnique({
          where: { id: Number(lcId) },
          select: { course_id: true }
        });
        if (liveClass?.course_id) {
          const course = await prisma.course.findUnique({
            where: { id: liveClass.course_id },
            select: { instructor_id: true }
          });
          if (course?.instructor_id) {
            resolvedTeacherId = course.instructor_id;
          }
        }
      } catch (e) {
        console.error('Failed to auto-resolve teacher_id:', e.message);
      }
    }

    const session = await SessionRepository.create({
      liveClassId: lcId, title, start_time, end_time, teacher_id: resolvedTeacherId, join_open_minutes
    });

    try {
      await this._notifyEnrolledStudents(lcId, session);
    } catch (e) {
      console.error('Failed to send session notifications:', e.message);
    }

    return session;
  }

  async getSessionsByLiveClassId(liveClassId) {
    if (!liveClassId) throw new Error('LiveClass ID is required');
    return SessionRepository.findByLiveClassId(liveClassId);
  }

  async getActiveSessions() {
    return SessionRepository.findActiveSessions();
  }

  async getToday() {
    return SessionRepository.findToday();
  }

  async getMyTeaching(userId) {
    return SessionRepository.findByTeacherUpcoming(userId);
  }

  async updateSession(id, sessionData) {
    return SessionRepository.update(id, sessionData);
  }

  async deleteSession(id) {
    return SessionRepository.delete(id);
  }

  async openSession(id, user) {
    const session = await SessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    const canOpen = hasRole(user.role, 'admin') ||
      Number(session.instructor_id) === Number(user.id) ||
      Number(session.teacher_id) === Number(user.id);

    if (!canOpen) throw new Error('Bạn không có quyền mở lớp này');
    if (session.status === 'ended') throw new Error('Không thể mở lại lớp đã kết thúc');

    if (session.course_id && !session.is_course_published) {
      await prisma.course.update({
        where: { id: Number(session.course_id) },
        data: { is_published: true, status: 'published' }
      });
    }

    await SessionRepository.openSession(id);

    try {
      await this._notifyClassOpen(session);
    } catch (e) {
      console.error('Failed to send open notification:', e.message);
    }

    return SessionRepository.findById(id);
  }

  async endSession(id, user) {
    const session = await SessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    const canEnd = hasRole(user.role, 'admin') ||
      Number(session.instructor_id) === Number(user.id) ||
      Number(session.teacher_id) === Number(user.id);

    if (!canEnd) throw new Error('Bạn không có quyền kết thúc lớp này');
    await SessionRepository.endSession(id);
    return SessionRepository.findById(id);
  }

  async getSessionForJoin(meetingId) {
    let session = await SessionRepository.findByMeetingId(meetingId);
    if (!session) session = await SessionRepository.findById(meetingId);
    return session;
  }

  async _notifyEnrolledStudents(liveClassId, session) {
    const liveClass = await prisma.live_classes.findUnique({
      where: { id: Number(liveClassId) },
      select: { course_id: true }
    });
    if (!liveClass) return;

    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: liveClass.course_id, status: 'active' },
      select: { student_id: true }
    });

    const startStr = new Date(session.start_time).toLocaleString('vi-VN');
    const message = `Lớp học "${session.title}" đã được lên lịch vào ${startStr}`;
    const link = `/session/${session.meeting_id}/join`;

    for (const row of enrollments) {
      await NotificationService.createNotification(row.student_id, message, 'session_scheduled', link);
    }
  }

  async _notifyClassOpen(session) {
    const courseId = session.course_id || session.live_classes?.course_id;
    if (!courseId) return;

    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: Number(courseId), status: 'active' },
      select: { student_id: true }
    });

    const message = `Lớp học "${session.title}" đã được mở! Hãy tham gia ngay.`;
    const link = `/session/${session.meeting_id}/join`;

    for (const row of enrollments) {
      await NotificationService.createNotification(row.student_id, message, 'session_open', link);
    }
  }
}

module.exports = new SessionService();
