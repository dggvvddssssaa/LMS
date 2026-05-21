const prisma = require('../config/prisma');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const CourseRepository = require('../repositories/CourseRepository');

class EnrollmentService {
  async enroll(userId, courseId) {
    const course = await CourseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const actualPrice = parseFloat(course.sale_price) > 0 ? parseFloat(course.sale_price) : parseFloat(course.price);
    if (actualPrice > 0) {
      throw new Error('Direct enrollment is only allowed for free courses');
    }
    return EnrollmentRepository.enroll(userId, courseId);
  }

  async getMyCourses(userId) {
    return EnrollmentRepository.findByUser(userId);
  }

  async checkEnrollment(userId, courseId) {
    return EnrollmentRepository.checkEnrollment(userId, courseId);
  }

  async checkout(userId, courseId) {
    const exists = await EnrollmentRepository.checkEnrollment(userId, courseId);
    if (exists) throw new Error('Already enrolled');

    const course = await CourseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const actualPrice = parseFloat(course.sale_price) > 0 ? parseFloat(course.sale_price) : parseFloat(course.price);

    if (actualPrice === 0) {
      const enrollment = await EnrollmentRepository.enroll(userId, courseId);
      return { type: 'free', enrollment };
    }

    const bankInfo = await prisma.global_settings.findUnique({ where: { key: 'bank_info' } });
    if (!bankInfo) throw new Error('Bank info not configured by admin yet');

    const transactionId = `LMS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    await prisma.payment.create({
      data: {
        student_id: userId,
        course_id: Number(courseId),
        amount: actualPrice,
        status: 'pending',
        payment_method: 'bank_transfer',
        transaction_id: transactionId,
        provider: 'sepay'
      }
    }).catch(() => {});

    const bank = bankInfo.value || {};
    // Ensure bankCode is what vietqr expects. 'MB' usually.
    const bankCode = bank.bankCode || 'MB';
    return {
      type: 'paid',
      amount: actualPrice,
      transactionId,
      vietQrConfig: {
        bankBin: bank.bankBin || '970422',
        bankCode: bankCode,
        bank: bankCode, // Fallback for frontend that uses qrConfig.bank
        accountNo: bank.accountNumber || '0867148774',
        accountName: bank.accountName || 'DINH MINH PHUONG',
        amount: actualPrice,
        description: `${transactionId}`
      }
    };
  }

  async confirmPayment(transactionId, userId) {
    const error = new Error('Client-side confirmation is disabled. Please wait for automatic verification.');
    error.statusCode = 410;
    throw error;
  }

  async checkPaymentStatus(transactionId, userId) {
    const payment = await prisma.payment.findFirst({
      where: { transaction_id: transactionId, student_id: userId },
      select: { status: true, course_id: true, amount: true, created_at: true }
    });

    if (!payment) throw new Error('Transaction not found');

    return {
      status: payment.status,
      courseId: payment.course_id,
      amount: payment.amount,
      createdAt: payment.created_at
    };
  }

  async getReceipts(userId) {
    return prisma.payment.findMany({
      where: { student_id: userId, status: 'completed' },
      select: {
        id: true,
        amount: true,
        transaction_id: true,
        updated_at: true,
        course: { select: { title: true } }
      },
      orderBy: { updated_at: 'desc' }
    });
  }
}

module.exports = new EnrollmentService();
