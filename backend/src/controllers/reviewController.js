const ReviewService = require('../services/ReviewService');

exports.getCourseReviews = async (req, res) => {
  try {
    const result = await ReviewService.getCourseReviews(req.params.courseId, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const review = await ReviewService.createReview(req.user.id, courseId, rating, comment);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const review = await ReviewService.updateReview(req.user.id, courseId, rating, comment);
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await ReviewService.deleteReview(req.user.id, parseInt(courseId, 10));
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
