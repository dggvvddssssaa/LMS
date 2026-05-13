const SessionRepository = require('../repositories/SessionRepository');
const NotificationService = require('./NotificationService');
const db = require('../config/db');
const { hasRole } = require('../utils/roles');

class SessionService {
  async createSession(sessionData) {
    const { liveClassId, live_class_id, title, start_time, end_time, teacher_id, join_open_minutes } = sessionData;
    const lcId = liveClassId || live_class_id;
    if (!lcId || !title || !start_time) {
      throw new Error('Missing required session data (liveClassId, title, start_time)');
    }
    const session = await SessionRepository.create({
      liveClassId: lcId, title, start_time, end_time, teacher_id, join_open_minutes
    });

    // Notify enrolled students
    try {
      await this._notifyEnrolledStudents(lcId, session);
    } catch (e) {
      // Don't fail session creation if notification fails
      console.error('Failed to send session notifications:', e.message);
    }

    return session;
  }

  async getSessionsByLiveClassId(liveClassId) {
    if (!liveClassId) throw new Error('LiveClass ID is required');
    return await SessionRepository.findByLiveClassId(liveClassId);
  }

  async getActiveSessions() {
    return await SessionRepository.findActiveSessions();
  }

  async getToday() {
    return await SessionRepository.findToday();
  }

  async getMyTeaching(userId) {
    return await SessionRepository.findByTeacherUpcoming(userId);
  }

  async updateSession(id, sessionData) {
    return await SessionRepository.update(id, sessionData);
  }

  async deleteSession(id) {
    return await SessionRepository.delete(id);
  }

  async openSession(id, user) {
    const session = await SessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    // Only admin, course instructor, or assigned teacher can open
    const canOpen = hasRole(user.role, 'admin') ||
      session.instructor_id === user.id ||
      session.teacher_id === user.id;

    if (!canOpen) throw new Error('Bạn không có quyền mở lớp này');

    if (session.status === 'ended') throw new Error('Không thể mở lại lớp đã kết thúc');

    const updated = await SessionRepository.openSession(id);

    // Notify students that class is now open
    try {
      await this._notifyClassOpen(session);
    } catch (e) {
      console.error('Failed to send open notification:', e.message);
    }

    return updated;
  }

  async endSession(id, user) {
    const session = await SessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    const canEnd = hasRole(user.role, 'admin') ||
      session.instructor_id === user.id ||
      session.teacher_id === user.id;

    if (!canEnd) throw new Error('Bạn không có quyền kết thúc lớp này');

    return await SessionRepository.endSession(id);
  }

  async getSessionForJoin(meetingId) {
    let session = await SessionRepository.findByMeetingId(meetingId);
    if (!session) {
      session = await SessionRepository.findById(meetingId);
    }
    return session;
  }

  // --- Private helpers ---

  async _notifyEnrolledStudents(liveClassId, session) {
    // Get course_id from live_class
    const lcRes = await db.query('SELECT course_id FROM live_classes WHERE id = $1', [liveClassId]);
    if (lcRes.rows.length === 0) return;
    const courseId = lcRes.rows[0].course_id;

    // Get enrolled students
    const enrollRes = await db.query(
      "SELECT student_id FROM enrollments WHERE course_id = $1 AND status = 'active'",
      [courseId]
    );

    const startStr = new Date(session.start_time).toLocaleString('vi-VN');
    const message = `Lớp học "${session.title}" đã được lên lịch vào ${startStr}`;
    const link = `/session/${session.meeting_id}/join`;

    for (const row of enrollRes.rows) {
      await NotificationService.createNotification(row.student_id, message, 'session_scheduled', link);
    }
  }

  async _notifyClassOpen(session) {
    if (!session.course_id) return;
    const enrollRes = await db.query(
      "SELECT student_id FROM enrollments WHERE course_id = $1 AND status = 'active'",
      [session.course_id]
    );

    const message = `Lớp học "${session.title}" đã được mở! Hãy tham gia ngay.`;
    const link = `/session/${session.meeting_id}/join`;

    for (const row of enrollRes.rows) {
      await NotificationService.createNotification(row.student_id, message, 'session_open', link);
    }
  }
}

module.exports = new SessionService();
