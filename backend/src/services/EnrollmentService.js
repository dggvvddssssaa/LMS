const EnrollmentRepository = require('../repositories/EnrollmentRepository');

class EnrollmentService {
  async enroll(userId, courseId) {
    const CourseRepository = require('../repositories/CourseRepository');
    const course = await CourseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');
    
    const actualPrice = parseFloat(course.sale_price) > 0 ? parseFloat(course.sale_price) : parseFloat(course.price);
    if (actualPrice > 0) {
      throw new Error('Direct enrollment is only allowed for free courses');
    }
    return await EnrollmentRepository.enroll(userId, courseId);
  }

  async getMyCourses(userId) {
    return await EnrollmentRepository.findByUser(userId);
  }

  async checkEnrollment(userId, courseId) {
    return await EnrollmentRepository.checkEnrollment(userId, courseId);
  }

  async checkout(userId, courseId) {
    const CourseRepository = require('../repositories/CourseRepository');
    const db = require('../config/db');
    
    // Check if already enrolled
    const exists = await EnrollmentRepository.checkEnrollment(userId, courseId);
    if (exists) throw new Error('Already enrolled');

    const course = await CourseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const actualPrice = parseFloat(course.sale_price) > 0 ? parseFloat(course.sale_price) : parseFloat(course.price);

    if (actualPrice === 0) {
      // Free course -> Direct enrollment
      const enrollment = await EnrollmentRepository.enroll(userId, courseId);
      return { type: 'free', enrollment };
    } else {
      // Paid course -> create pending payment record and generate VietQR
      const { rows } = await db.query('SELECT value FROM global_settings WHERE key = $1', ['bank_info']);
      const bankInfo = rows.length > 0 ? rows[0].value : null;

      if (!bankInfo) {
         throw new Error('Bank info not configured by admin yet');
      }

      const transactionId = `LMS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Record pending payment in database
      await db.query(
        `INSERT INTO payments (student_id, course_id, amount, status, payment_method, transaction_id, provider)
         VALUES ($1, $2, $3, 'pending', 'bank_transfer', $4, 'sepay')
         ON CONFLICT DO NOTHING`,
        [userId, courseId, actualPrice, transactionId]
      );

      return { 
        type: 'paid', 
        amount: actualPrice,
        transactionId,
        vietQrConfig: {
          bankBin: bankInfo.bankBin || '970422',
          bankCode: bankInfo.bankCode || 'MB',
          accountNo: bankInfo.accountNumber || '0867148774',
          accountName: bankInfo.accountName || 'DINH MINH PHUONG',
          amount: actualPrice,
          description: `${transactionId}`
        }
      };
    }
  }

  async confirmPayment(transactionId, userId) {
    const error = new Error('Client-side confirmation is disabled. Please wait for automatic verification.');
    error.statusCode = 410;
    throw error;
  }

  async checkPaymentStatus(transactionId, userId) {
    const db = require('../config/db');

    const { rows } = await db.query(
      `SELECT status, course_id, amount, created_at FROM payments WHERE transaction_id = $1 AND student_id = $2`,
      [transactionId, userId]
    );

    if (rows.length === 0) {
      throw new Error('Transaction not found');
    }

    return {
      status: rows[0].status,
      courseId: rows[0].course_id,
      amount: rows[0].amount,
      createdAt: rows[0].created_at
    };
  }

  async getReceipts(userId) {
    const db = require('../config/db');
    const { rows } = await db.query(
      `SELECT p.id, p.amount, p.transaction_id, p.updated_at as date, c.title as course_title
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       WHERE p.student_id = $1 AND p.status = 'completed'
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    return rows;
  }
}
module.exports = new EnrollmentService();
