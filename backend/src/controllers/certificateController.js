const db = require('../config/db');

exports.getMyCertificates = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.certificate_url, c.issued_at, co.title as course_title, co.thumbnail as course_thumbnail
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.certificate_url, c.issued_at, c.user_id, c.course_id,
              u.name as student_name, u.email as student_email,
              co.title as course_title, co.thumbnail as course_thumbnail,
              i.name as instructor_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users i ON co.instructor_id = i.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCertificateByCourse = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.certificate_url, c.issued_at, c.user_id, c.course_id,
              u.name as student_name, u.email as student_email,
              co.title as course_title, co.thumbnail as course_thumbnail,
              i.name as instructor_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users i ON co.instructor_id = i.id
       WHERE c.course_id = $1 AND c.user_id = $2`,
      [req.params.courseId, req.user.id]
    );
    if (rows.length === 0) return res.status(200).json({ success: true, data: null });
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.user.id;

    // 1. Check enrollment exists
    const enrollCheck = await db.query(
      'SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, userId]
    );
    if (enrollCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Bạn chưa đăng ký khóa học này' });
    }
    const enrollmentId = enrollCheck.rows[0].id;

    // 2. Check progress = 100%
    const progressCheck = await db.query(
      `SELECT COUNT(DISTINCT l.id) as total_lessons,
              COUNT(DISTINCT lp.lesson_id) as completed_lessons
       FROM sections s
       JOIN lessons l ON l.section_id = s.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = $2 AND lp.is_completed = true
       WHERE s.course_id = $1`,
      [courseId, userId]
    );

    const { total_lessons, completed_lessons } = progressCheck.rows[0];
    const totalInt = parseInt(total_lessons);
    const completedInt = parseInt(completed_lessons);

    if (totalInt > 0 && completedInt < totalInt) {
      return res.status(400).json({
        success: false,
        message: `Bạn mới hoàn thành ${completedInt}/${totalInt} bài học. Cần hoàn thành 100% để nhận chứng chỉ.`
      });
    }

    // 3. Check if certificate already exists
    const existingCert = await db.query(
      'SELECT id FROM certificates WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (existingCert.rows.length > 0) {
      // Return existing certificate
      const certId = existingCert.rows[0].id;
      const { rows } = await db.query(
        `SELECT c.id, c.certificate_url, c.issued_at, c.user_id, c.course_id,
                u.name as student_name, u.email as student_email,
                co.title as course_title, i.name as instructor_name
         FROM certificates c
         JOIN users u ON c.user_id = u.id
         JOIN courses co ON c.course_id = co.id
         LEFT JOIN users i ON co.instructor_id = i.id
         WHERE c.id = $1`,
        [certId]
      );
      return res.status(200).json({ success: true, message: 'Chứng chỉ đã tồn tại', data: rows[0] });
    }

    // 4. Generate new certificate
    const certUrl = `/certificate/view`; // Will be rendered client-side
    const insertResult = await db.query(
      `INSERT INTO certificates (enrollment_id, user_id, course_id, certificate_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [enrollmentId, userId, courseId, certUrl]
    );
    const newCert = insertResult.rows[0];

    // 5. Fetch full data
    const { rows } = await db.query(
      `SELECT c.id, c.certificate_url, c.issued_at, c.user_id, c.course_id,
              u.name as student_name, u.email as student_email,
              co.title as course_title, i.name as instructor_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users i ON co.instructor_id = i.id
       WHERE c.id = $1`,
      [newCert.id]
    );

    res.status(201).json({ success: true, message: 'Chứng chỉ đã được cấp thành công!', data: rows[0] });
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
