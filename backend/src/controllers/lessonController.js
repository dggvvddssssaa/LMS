const LessonRepository = require('../repositories/LessonRepository');

exports.createLesson = async (req, res) => {
  try {
    const newLesson = await LessonRepository.create(req.body);
    res.status(201).json({ success: true, data: newLesson });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const updates = req.body; // Expects an array [{ id: 1, order_index: 0 }, ...]
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Expected an array of updates' });
    }
    const results = await LessonRepository.batchUpdateOrder(updates);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const updatedLesson = await LessonRepository.update(req.params.id, req.body);
    if (!updatedLesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.status(200).json({ success: true, data: updatedLesson });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const result = await LessonRepository.delete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
