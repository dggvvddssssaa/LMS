const EnrollmentService = require('../services/EnrollmentService');

exports.enroll = async (req, res) => {
  try {
    const result = await EnrollmentService.enroll(req.user.id, req.body.courseId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const result = await EnrollmentService.checkout(req.user.id, req.body.courseId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }
    const result = await EnrollmentService.confirmPayment(transactionId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const result = await EnrollmentService.checkPaymentStatus(req.params.transactionId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await EnrollmentService.getMyCourses(req.user.id);
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkEnrollment = async (req, res) => {
  try {
    const enrollment = await EnrollmentService.checkEnrollment(req.user.id, req.params.courseId);
    res.status(200).json({ success: true, isEnrolled: !!enrollment, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReceipts = async (req, res) => {
  try {
    const receipts = await EnrollmentService.getReceipts(req.user.id);
    res.status(200).json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
