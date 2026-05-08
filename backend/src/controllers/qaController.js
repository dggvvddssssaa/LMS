const QAService = require('../services/QAService');

exports.getQuestions = async (req, res) => {
  try {
    const { lessonId } = req.query;
    const questions = await QAService.getQuestions(req.params.courseId, lessonId);
    res.status(200).json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postQuestion = async (req, res) => {
  try {
    const { courseId, lessonId, title, content } = req.body;
    const question = await QAService.postQuestion(req.user.id, courseId, lessonId, title, content);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.postAnswer = async (req, res) => {
  try {
    const { questionId, content } = req.body;
    const answer = await QAService.postAnswer(req.user.id, questionId, content);
    res.status(201).json({ success: true, data: answer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.acceptAnswer = async (req, res) => {
  try {
    const answer = await QAService.acceptAnswer(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: answer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
