const ProgressService = require('../services/ProgressService');

exports.markComplete = async (req, res) => {
  try {
    const { courseId, lessonId, isCompleted = true } = req.body;
    const result = await ProgressService.markComplete(req.user.id, courseId, lessonId, isCompleted);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.savePosition = async (req, res) => {
  try {
    const { courseId, lessonId, lastPosition } = req.body;
    const result = await ProgressService.savePosition(req.user.id, courseId, lessonId, lastPosition);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await ProgressService.getCourseProgress(req.user.id, req.params.courseId);
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
