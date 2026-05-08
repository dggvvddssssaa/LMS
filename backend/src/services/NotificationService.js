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
  async createNotification(userId, message, type) {
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, message, type) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, message, type]
    );
    return rows[0];
  }
}

module.exports = new NotificationService();
