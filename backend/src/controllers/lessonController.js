const LessonRepository = require('../repositories/LessonRepository');
const { normalizeYouTubeUrl, isYouTubeUrl, isValidYouTubeUrl } = require('../utils/youtube');

exports.createLesson = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.content_type === 'video') {
      const url = payload.video_url || payload.content_url;
      if (isYouTubeUrl(url)) {
        if (!isValidYouTubeUrl(url)) {
          return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
        }
        const normalized = normalizeYouTubeUrl(url);
        payload.video_url = normalized;
        payload.content_url = normalized;
      }
    }
    const newLesson = await LessonRepository.create(payload);
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
    const payload = { ...req.body };
    if (payload.content_type === 'video' || payload.video_url || payload.content_url) {
      const url = payload.video_url || payload.content_url;
      if (isYouTubeUrl(url)) {
        if (!isValidYouTubeUrl(url)) {
          return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
        }
        const normalized = normalizeYouTubeUrl(url);
        if (payload.video_url !== undefined) payload.video_url = normalized;
        if (payload.content_url !== undefined) payload.content_url = normalized;
      }
    }
    const updatedLesson = await LessonRepository.update(req.params.id, payload);
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
