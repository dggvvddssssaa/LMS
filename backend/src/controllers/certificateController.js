const prisma = require('../config/prisma');
const CertificateService = require('../services/CertificateService');

exports.getMyCertificates = async (req, res) => {
  try {
    const certs = await prisma.certificates.findMany({
      where: { user_id: req.user.id },
      select: {
        id: true,
        certificate_url: true,
        pdf_url: true,
        issued_at: true,
        course_id: true,
        course_title_snapshot: true,
        verify_url: true,
        status: true
      },
      orderBy: { issued_at: 'desc' }
    });
    // Map course_title_snapshot to course_title for frontend compat
    const rows = certs.map(c => ({ ...c, course_title: c.course_title_snapshot }));
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
    const cert = await prisma.certificates.findFirst({
      where: { course_id: Number(req.params.courseId), user_id: req.user.id },
      select: { id: true }
    });
    if (!cert) return res.status(200).json({ success: true, data: null });
    
    const fullCert = await CertificateService.getCertificateDetails(cert.id);
    res.status(200).json({ success: true, data: fullCert });
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
    const cert = await prisma.certificates.findFirst({
      where: { certificate_code: code },
      select: { id: true }
    });
    
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    const fullCert = await CertificateService.getCertificateDetails(cert.id);
    
    // Filter PII and internals
    delete fullCert.student_email_snapshot;
    delete fullCert.metadata_json;
    delete fullCert.enrollment_id;
    delete fullCert.user_id;

    res.status(200).json({ success: true, data: fullCert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
