const db = require('../config/db');
const CertificateService = require('../services/CertificateService');

exports.getMyCertificates = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, certificate_url, pdf_url, issued_at, course_id, 
              course_title_snapshot as course_title, verify_url, status
       FROM certificates
       WHERE user_id = $1
       ORDER BY issued_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const cert = await CertificateService.getCertificateDetails(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    if (req.user.role !== 'admin' && req.user.id !== cert.user_id) {
       return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    res.status(200).json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCertificateByCourse = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id FROM certificates WHERE course_id = $1 AND user_id = $2`,
      [req.params.courseId, req.user.id]
    );
    if (rows.length === 0) return res.status(200).json({ success: true, data: null });
    
    const cert = await CertificateService.getCertificateDetails(rows[0].id);
    res.status(200).json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.user.id;

    const cert = await CertificateService.issueCertificate(userId, courseId);

    res.status(201).json({ success: true, message: 'Chứng chỉ đã được cấp thành công!', data: cert });
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const { rows } = await db.query(
      `SELECT id FROM certificates WHERE certificate_code = $1`,
      [code]
    );
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    const cert = await CertificateService.getCertificateDetails(rows[0].id);
    
    // Filter PII and internals
    delete cert.student_email_snapshot;
    delete cert.metadata_json;
    delete cert.enrollment_id;
    delete cert.user_id;

    res.status(200).json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
