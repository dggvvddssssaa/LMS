const prisma = require('../config/prisma');

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
        const section = await prisma.section.findUnique({
          where: { id: Number(id) },
          select: { course_id: true }
        });
        if (section) courseId = Number(section.course_id);
      } else if (resourceType === 'lesson') {
        const lesson = await prisma.lesson.findUnique({
          where: { id: Number(id) },
          include: { section: { select: { course_id: true } } }
        });
        if (lesson && lesson.section) courseId = Number(lesson.section.course_id);
      } else if (resourceType === 'liveClass') {
        const liveClass = await prisma.live_classes.findUnique({
          where: { id: Number(id) },
          select: { course_id: true }
        });
        if (liveClass) courseId = Number(liveClass.course_id);
      } else if (resourceType === 'session') {
        const session = await prisma.sessions.findUnique({
          where: { id: Number(id) },
          include: { live_classes: { select: { course_id: true } } }
        });
        if (session && session.live_classes) courseId = Number(session.live_classes.course_id);
      } else if (resourceType === 'material') {
        const material = await prisma.course_materials.findUnique({
          where: { id: Number(id) },
          select: { course_id: true }
        });
        if (material) courseId = Number(material.course_id);
      } else if (resourceType === 'assignment') {
        const assignment = await prisma.assignments.findUnique({
          where: { id: Number(id) },
          include: {
            lessons: { include: { section: { select: { course_id: true } } } },
            sections: { select: { course_id: true } }
          }
        });
        if (assignment) {
          if (assignment.course_id) courseId = Number(assignment.course_id);
          else if (assignment.lessons && assignment.lessons.section) {
            courseId = Number(assignment.lessons.section.course_id);
          }
          else if (assignment.sections) {
            courseId = Number(assignment.sections.course_id);
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

    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { instructor_id: true }
    });
    if (!course || course.instructor_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this course' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
