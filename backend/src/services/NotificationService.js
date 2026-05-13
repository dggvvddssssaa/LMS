const db = require('../config/db');

class NotificationService {
  async getNotifications(userId) {
    const { rows } = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async markAsRead(userId, notificationId) {
    const { rows } = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (rows.length === 0) {
        throw new Error('Notification not found or unauthorized');
    }
    
    return rows[0];
  }

  async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  // System utility to create notifications
  async createNotification(userId, message, type, link) {
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, message, type, link) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, message, type || null, link || null]
    );
    return rows[0];
  }

  // Batch notify all enrolled students of a course
  async notifyEnrolledStudents(courseId, message, type, link) {
    const enrollRes = await db.query(
      "SELECT student_id FROM enrollments WHERE course_id = $1 AND status = 'active'",
      [courseId]
    );

    const results = [];
    for (const row of enrollRes.rows) {
      const notif = await this.createNotification(row.student_id, message, type, link);
      results.push(notif);
    }
    return results;
  }
}

module.exports = new NotificationService();
