const AssignmentRepository = require('../repositories/AssignmentRepository');

exports.getAssignmentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const assignments = await AssignmentRepository.getByLesson(lessonId);
    res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const newAssignment = await AssignmentRepository.create(req.body);
    res.status(201).json({ success: true, data: newAssignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const updatedAssignment = await AssignmentRepository.update(req.params.id, req.body);
    if (!updatedAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: updatedAssignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const result = await AssignmentRepository.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.userId; // Ensure verifyToken middleware is used
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
        if (answers && answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });
      
      score = Math.round((correctCount / questions.length) * (assignment.score_max || 100));
      status = 'graded';
    }
    
    const submission = await AssignmentRepository.submitAssignment({
      assignment_id: assignmentId,
      student_id: studentId,
      answers,
      score,
      status
    });
    
    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assignmentId = req.params.id;
    
    const submission = await AssignmentRepository.getSubmission(assignmentId, studentId);
    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
