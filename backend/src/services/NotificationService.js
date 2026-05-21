const prisma = require('../config/prisma');

class NotificationService {
  async getNotifications(userId) {
    return prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }

  async markAsRead(userId, notificationId) {
    const result = await prisma.notifications.updateMany({
      where: { id: Number(notificationId), user_id: userId },
      data: { is_read: true }
    });
    if (result.count === 0) throw new Error('Notification not found or unauthorized');
    return prisma.notifications.findUnique({ where: { id: Number(notificationId) } });
  }

  async markAllAsRead(userId) {
    await prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });
  }

  async createNotification(userId, message, type, link) {
    return prisma.notifications.create({
      data: {
        user_id: userId,
        message,
        type: type || null,
        link: link || null
      }
    });
  }

  async notifyEnrolledStudents(courseId, message, type, link) {
    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: Number(courseId), status: 'active' },
      select: { student_id: true }
    });
    const results = [];
    for (const row of enrollments) {
      const notif = await this.createNotification(row.student_id, message, type, link);
      results.push(notif);
    }
    return results;
  }
}

module.exports = new NotificationService();
