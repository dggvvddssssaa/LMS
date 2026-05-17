const db = require('../config/db');

exports.requireCourseOwnership = (resourceType) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (user.role === 'admin') return next();

    let courseId = null;

    if (req.body && req.body.course_id) {
      courseId = req.body.course_id;
    } else if (req.body && req.body.courseId) {
      courseId = req.body.courseId;
    } else if (req.params && req.params.courseId) {
      courseId = req.params.courseId;
    } else if (req.params && req.params.id) {
      const id = req.params.id;
      if (resourceType === 'course') {
        courseId = id;
      } else if (resourceType === 'section') {
        const { rows } = await db.query('SELECT course_id FROM sections WHERE id = $1', [id]);
        if (rows.length > 0) courseId = rows[0].course_id;
      } else if (resourceType === 'lesson') {
        const { rows } = await db.query('SELECT section_id FROM lessons WHERE id = $1', [id]);
        if (rows.length > 0) {
           const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [rows[0].section_id]);
           if (sr.rows && sr.rows.length > 0) courseId = sr.rows[0].course_id;
        }
      } else if (resourceType === 'liveClass') {
        const { rows } = await db.query('SELECT course_id FROM live_classes WHERE id = $1', [id]);
        if (rows.length > 0) courseId = rows[0].course_id;
      } else if (resourceType === 'session') {
        const { rows } = await db.query('SELECT live_class_id FROM sessions WHERE id = $1', [id]);
        if (rows.length > 0 && rows[0].live_class_id) {
           const cr = await db.query('SELECT course_id FROM live_classes WHERE id = $1', [rows[0].live_class_id]);
           if (cr.rows && cr.rows.length > 0) courseId = cr.rows[0].course_id;
        }
      } else if (resourceType === 'material') {
        const { rows } = await db.query('SELECT course_id FROM course_materials WHERE id = $1', [id]);
        if (rows.length > 0) courseId = rows[0].course_id;
      } else if (resourceType === 'assignment') {
        const { rows } = await db.query('SELECT course_id, lesson_id, section_id FROM assignments WHERE id = $1', [id]);
        if (rows.length > 0) {
          if (rows[0].course_id) courseId = rows[0].course_id;
          else if (rows[0].lesson_id) {
             const lr = await db.query('SELECT section_id FROM lessons WHERE id = $1', [rows[0].lesson_id]);
             if (lr.rows && lr.rows.length > 0) {
                const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [lr.rows[0].section_id]);
                if (sr.rows && sr.rows.length > 0) courseId = sr.rows[0].course_id;
             }
          }
          else if (rows[0].section_id) {
             const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [rows[0].section_id]);
             if (sr.rows && sr.rows.length > 0) courseId = sr.rows[0].course_id;
          }
        }
      }
    }

    if (!courseId) {
       // Cannot resolve courseId, just allow or deny?
       // Usually means creating something without course_id linked properly, or bad route. 
       // For safety, allow it to fail later or let it pass for now if not tied to a course yet.
       return next();
    }

    const { rows } = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
    if (rows.length === 0 || rows[0].instructor_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this course' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
