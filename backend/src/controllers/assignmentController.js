const AssignmentRepository = require('../repositories/AssignmentRepository');
const db = require('../config/db');

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
    const { rows } = await db.query('SELECT course_id, lesson_id, section_id FROM assignments WHERE id = $1', [id]);
    if (rows.length > 0) {
      if (rows[0].course_id) return rows[0].course_id;
      if (rows[0].lesson_id) {
         const lr = await db.query('SELECT section_id FROM lessons WHERE id = $1', [rows[0].lesson_id]);
         if (lr.rows.length > 0) {
            const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [lr.rows[0].section_id]);
            if (sr.rows.length > 0) return sr.rows[0].course_id;
         }
      }
      if (rows[0].section_id) {
         const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [rows[0].section_id]);
         if (sr.rows.length > 0) return sr.rows[0].course_id;
      }
    }
  }
  if (body && body.lesson_id) {
     const lr = await db.query('SELECT section_id FROM lessons WHERE id = $1', [body.lesson_id]);
     if (lr.rows.length > 0) {
        const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [lr.rows[0].section_id]);
        if (sr.rows.length > 0) return sr.rows[0].course_id;
     }
  }
  if (body && body.section_id) {
     const sr = await db.query('SELECT course_id FROM sections WHERE id = $1', [body.section_id]);
     if (sr.rows.length > 0) return sr.rows[0].course_id;
  }
  return null;
};

const checkCourseOwnership = async (courseId, user) => {
  if (user.role === 'admin') return true;
  if (!courseId) return true; // If we can't resolve, let it pass or fail later
  const { rows } = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
  if (rows.length === 0 || rows[0].instructor_id !== user.id) {
    const err = new Error('Forbidden: You do not own this course');
    err.statusCode = 403;
    throw err;
  }
  return true;
};

exports.getAssignmentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const assignments = await AssignmentRepository.getByLesson(lessonId);
    res.status(200).json({ success: true, data: sanitizeAssignments(assignments, req.user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.getAssignmentsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
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
    
    // Simple auto-grading logic for MCQ
    const assignment = await AssignmentRepository.getById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    let score = 0;
    let status = 'submitted';
    
    if (assignment.kind === 'mcq' && assignment.payload && assignment.payload.questions) {
      const questions = assignment.payload.questions;
      let correctCount = 0;
      
      // Compute score
      questions.forEach((q, idx) => {
        const qId = q.id || idx;
        const correctOpt = q.correctOptionId !== undefined ? q.correctOptionId : q.correctAnswer;
        if (answers && answers[qId] === correctOpt) {
          correctCount++;
        }
      });
      
      score = Math.round((correctCount / questions.length) * (assignment.score_max || 100));
      const passPercent = assignment.pass_percent || 80;
      const isPassed = score >= (assignment.score_max || 100) * (passPercent / 100);
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
    
    const submission = await AssignmentRepository.getSubmission(assignmentId, studentId);
    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getFinalAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignment = await AssignmentRepository.getByCourseFinal(courseId);
    res.status(200).json({ success: true, data: sanitizeAssignments(assignment, req.user) });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};
