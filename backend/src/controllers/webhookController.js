const db = require('../config/db');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

exports.sepayWebhook = async (req, res) => {
  try {
    const apiKey = req.headers.authorization;
    if (!apiKey || apiKey !== `Apikey ${process.env.SEPAY_WEBHOOK_API_KEY}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body;
    
    // SePay Webhook Payload Example:
    // { id: 123, gateway: 'MBBank', transactionDate: '...', accountNumber: '0867148774', subAccount: null,
    //   code: '...', content: 'LMS1234567', transferType: 'in', transferAmount: 10000, accumulated: 50000,
    //   referenceCode: 'MB...' }

    if (payload.transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored outbound transaction' });
    }

    const { rows: settingsRows } = await db.query("SELECT value FROM global_settings WHERE key = 'bank_info'");
    const bankInfo = settingsRows.length > 0 ? settingsRows[0].value : null;
    const expectedAccount = bankInfo ? bankInfo.accountNumber : '0867148774';

    if (payload.accountNumber !== expectedAccount) {
      return res.status(200).json({ success: true, message: 'Ignored transaction for different account' });
    }

    // Match LMS transaction id from content
    const match = payload.content.match(/LMS[0-9A-Z]+/i);
    if (!match) {
      return res.status(200).json({ success: true, message: 'No LMS transaction id found in content' });
    }
    const transactionId = match[0].toUpperCase();

    // Check payment in db
    const { rows } = await db.query('SELECT * FROM payments WHERE transaction_id = $1', [transactionId]);
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: 'Payment not found' });
    }

    const payment = rows[0];

    // Check if event already processed
    if (payment.provider_event_id === String(payload.id)) {
       return res.status(200).json({ success: true, message: 'Event already processed' });
    }

    if (payment.status === 'completed') {
       return res.status(200).json({ success: true, message: 'Payment already completed' });
    }

    if (parseFloat(payment.amount) !== parseFloat(payload.transferAmount)) {
       // amount mismatch
       return res.status(200).json({ success: true, message: 'Amount mismatch' });
    }

    // Update payment
    await db.query(
      `UPDATE payments 
       SET status = 'completed', 
           provider_event_id = $1, 
           provider_reference_code = $2, 
           provider_payload = $3, 
           paid_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $4`,
      [String(payload.id), payload.referenceCode || payload.code, JSON.stringify(payload), payment.id]
    );

    // Enroll student
    await EnrollmentRepository.enroll(payment.student_id, payment.course_id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SePay Webhook Error:', err);
    // Return 200 anyway so SePay doesn't retry unnecessarily if it's a systemic error, 
    // or return 500 if we DO want retry. We'll return 500 to allow retry for DB errors.
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
