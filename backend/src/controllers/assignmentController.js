const AssignmentRepository = require('../repositories/AssignmentRepository');
const prisma = require('../config/prisma');

const sanitizeAssignments = (assignments, user) => {
  const isAdminOrInstructor = user.role === 'admin' || user.role === 'instructor';
  if (isAdminOrInstructor) return assignments;
  
  if (!assignments) return assignments;

  const sanitizeSingle = (a) => {
    if (!a.payload || !a.payload.questions) return a;
    const sanitizedPayload = {
      ...a.payload,
      questions: a.payload.questions.map(q => {
        const { correctOptionId, correctAnswer, ...rest } = q;
        return rest;
      })
    };
    return { ...a, payload: sanitizedPayload };
  };

  if (Array.isArray(assignments)) {
    return assignments.map(sanitizeSingle);
  }
  return sanitizeSingle(assignments);
};

const resolveCourseIdForAssignment = async (id, body) => {
  if (body && body.course_id) return body.course_id;
  if (id) {
    const assignment = await prisma.assignments.findUnique({
      where: { id: Number(id) },
      include: {
        lessons: { include: { section: true } },
        sections: true
      }
    });
    if (assignment) {
      if (assignment.course_id) return Number(assignment.course_id);
      if (assignment.lessons && assignment.lessons.section) {
        return Number(assignment.lessons.section.course_id);
      }
      if (assignment.sections) {
        return Number(assignment.sections.course_id);
      }
    }
  }
  if (body && body.lesson_id) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(body.lesson_id) },
      include: { section: true }
    });
    if (lesson && lesson.section) {
      return Number(lesson.section.course_id);
    }
  }
  if (body && body.section_id) {
    const section = await prisma.section.findUnique({
      where: { id: Number(body.section_id) },
      select: { course_id: true }
    });
    if (section) return Number(section.course_id);
  }
  return null;
};

const checkCourseOwnership = async (courseId, user) => {
  if (user.role === 'admin') return true;
  if (!courseId) return true; // If we can't resolve, let it pass or fail later
  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
    select: { instructor_id: true }
  });
  if (!course || course.instructor_id !== user.id) {
    const err = new Error('Forbidden: You do not own this course');
    err.statusCode = 403;
    throw err;
  }
  return true;
};

const checkCourseEnrollmentOrOwnership = async (courseId, user) => {
  if (user.role === 'admin') return true;
  if (!courseId) {
    const err = new Error('Forbidden: Cannot resolve course context');
    err.statusCode = 403;
    throw err;
  }
  if (user.role === 'instructor') {
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { instructor_id: true }
    });
    if (!course || course.instructor_id !== user.id) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }
  if (user.role === 'student') {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: user.id, course_id: Number(courseId) } }
    });
    if (!enrollment || enrollment.status !== 'active') {
      const err = new Error('Forbidden: You are not enrolled in this course');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }
  const err = new Error('Forbidden: Unauthorized role');
  err.statusCode = 403;
  throw err;
};

exports.getAssignmentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const courseId = await resolveCourseIdForAssignment(null, { lesson_id: lessonId });
    await checkCourseEnrollmentOrOwnership(courseId, req.user);
    const assignments = await AssignmentRepository.getByLesson(lessonId);
    res.status(200).json({ success: true, data: sanitizeAssignments(assignments, req.user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getAssignmentsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const courseId = await resolveCourseIdForAssignment(null, { section_id: sectionId });
    await checkCourseEnrollmentOrOwnership(courseId, req.user);
    const assignments = await AssignmentRepository.getBySection(sectionId);
    res.status(200).json({ success: true, data: sanitizeAssignments(assignments, req.user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const courseId = await resolveCourseIdForAssignment(null, req.body);
    await checkCourseOwnership(courseId, req.user);
    const newAssignment = await AssignmentRepository.create(req.body);
    res.status(201).json({ success: true, data: newAssignment });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const courseId = await resolveCourseIdForAssignment(req.params.id, req.body);
    await checkCourseOwnership(courseId, req.user);
    const updatedAssignment = await AssignmentRepository.update(req.params.id, req.body);
    if (!updatedAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: updatedAssignment });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const courseId = await resolveCourseIdForAssignment(req.params.id, null);
    await checkCourseOwnership(courseId, req.user);
    const result = await AssignmentRepository.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.id; // Ensure verifyToken middleware is used
    const assignmentId = req.params.id;
    const { answers } = req.body;
    
    const courseId = await resolveCourseIdForAssignment(assignmentId, null);
    await checkCourseEnrollmentOrOwnership(courseId, req.user);

    // Simple auto-grading logic for MCQ
    const assignment = await AssignmentRepository.getById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    let score = 0;
    let status = 'submitted';
    
    if (assignment.kind === 'mcq' && assignment.payload && assignment.payload.questions) {
      const questions = assignment.payload.questions;
      let earnedPoints = 0;
      const scoreMax = assignment.score_max || 100;
      
      questions.forEach((q, idx) => {
        const qId = q.id || String(idx);
        const correctOpt = q.correctOptionId !== undefined ? q.correctOptionId : q.correctAnswer;
        if (answers && answers[qId] === correctOpt) {
          // Use per-question points if available, otherwise divide evenly
          earnedPoints += (q.points || Math.round(scoreMax / questions.length));
        }
      });
      
      score = earnedPoints;
      const passPercent = assignment.pass_percent || 80;
      const isPassed = score >= scoreMax * (passPercent / 100);
      status = isPassed ? 'passed' : 'failed';
    }
    
    const submission = await AssignmentRepository.submitAssignment({
      assignment_id: assignmentId,
      student_id: studentId,
      answers,
      score,
      status
    });
    
    let certificate = null;
    if (assignment.assignment_scope === 'final' && assignment.course_id) {
       const ProgressService = require('../services/ProgressService');
       const progress = await ProgressService.getCourseProgress(studentId, assignment.course_id);
       certificate = await ProgressService.checkAndIssueCertificate(studentId, assignment.course_id, progress.enrollmentId, progress.overallProgress);
    }
    
    res.status(200).json({ success: true, data: { ...submission, certificate } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignmentId = req.params.id;
    
    const courseId = await resolveCourseIdForAssignment(assignmentId, null);
    await checkCourseEnrollmentOrOwnership(courseId, req.user);

    const submission = await AssignmentRepository.getSubmission(assignmentId, studentId);
    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getFinalAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    await checkCourseEnrollmentOrOwnership(courseId, req.user);
    const assignment = await AssignmentRepository.getByCourseFinal(courseId);
    res.status(200).json({ success: true, data: sanitizeAssignments(assignment, req.user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};
