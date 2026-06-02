const prisma = require('../config/prisma');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

exports.sepayWebhook = async (req, res) => {
  try {
    const apiKey = req.headers.authorization;
    const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
    if (!expectedKey) {
      console.error('CRITICAL: SEPAY_WEBHOOK_API_KEY is not set in environment.');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    if (!apiKey || apiKey !== `Apikey ${expectedKey}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    
    if (payload.transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored outbound transaction' });
    }

    const setting = await prisma.global_settings.findUnique({ where: { key: 'bank_info' } });
    const bankInfo = setting ? setting.value : null;
    const expectedAccount = bankInfo && bankInfo.accountNumber ? bankInfo.accountNumber : '0867148774';

    if (payload.accountNumber !== expectedAccount) {
      return res.status(200).json({ success: true, message: 'Ignored transaction for different account' });
    }

    // Match LMS transaction id from content
    const match = payload.content.match(/LMS[0-9A-Z]+/i);
    if (!match) {
      return res.status(200).json({ success: true, message: 'No LMS transaction id found in content' });
    }
    const transactionId = match[0].toUpperCase();

    // Use Prisma transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Check payment in db
      const payment = await tx.payment.findFirst({ where: { transaction_id: transactionId } });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check if event already processed
      if (payment.provider_event_id === String(payload.id)) {
        throw new Error('Event already processed');
      }

      if (payment.status === 'completed') {
        throw new Error('Payment already completed');
      }

      if (parseFloat(payload.transferAmount) < parseFloat(payment.amount)) {
        throw new Error('Amount mismatch: transferred amount is less than required');
      }

      // Update payment
      await tx.payment.update({
        where: { id: Number(payment.id) },
        data: {
          status: 'completed',
          provider_event_id: String(payload.id),
          provider_reference_code: payload.referenceCode || payload.code,
          provider_payload: payload,
          paid_at: new Date(),
          updated_at: new Date()
        }
      });

      // Check enrollment existence, if not exists, create it
      const existingEnrollment = await tx.enrollment.findUnique({
        where: { student_id_course_id: { student_id: payment.student_id, course_id: payment.course_id } }
      });

      if (existingEnrollment) {
        if (existingEnrollment.status !== 'active') {
          await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: { status: 'active', enrolled_at: new Date() }
          });
        }
      } else {
        await tx.enrollment.create({
          data: {
            student_id: payment.student_id,
            course_id: payment.course_id,
            status: 'active',
            progress: 0,
            enrolled_at: new Date()
          }
        });
      }
      
      // Create notification
      await tx.notifications.create({
        data: {
          user_id: payment.student_id,
          message: `Thanh toán thành công cho mã giao dịch ${transactionId}. Bạn đã được ghi danh vào khóa học.`,
          type: 'payment',
          is_read: false
        }
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SePay Webhook Error:', err);
    if (err.message === 'Payment not found' || err.message === 'Event already processed' || err.message === 'Payment already completed' || err.message.startsWith('Amount mismatch')) {
       return res.status(200).json({ success: true, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
