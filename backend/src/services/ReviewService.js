const ReviewRepository = require('../repositories/ReviewRepository');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

class ReviewService {
  async getCourseReviews(courseId, userId) {
    const reviews = await ReviewRepository.findByCourse(courseId);
    const avg = await ReviewRepository.getAverageRating(courseId);
    const existing = await ReviewRepository.findByUserAndCourse(userId, courseId);
    return { reviews, average: avg.average, count: avg.count, existing };
  }

  async createReview(userId, courseId, rating, comment) {
    const enrollment = await EnrollmentRepository.checkEnrollment(userId, courseId);
    if (!enrollment) throw new Error('Bạn cần đăng ký khóa học để đánh giá');

    const existing = await ReviewRepository.findByUserAndCourse(userId, courseId);
    if (existing) throw new Error('Bạn đã đánh giá khóa học này rồi');

    return ReviewRepository.create(userId, courseId, rating, comment);
  }

  async updateReview(userId, courseId, rating, comment) {
    const existing = await ReviewRepository.findByUserAndCourse(userId, courseId);
    if (!existing) throw new Error('Đánh giá không tồn tại');

    return ReviewRepository.update(userId, courseId, rating, comment);
  }

  async deleteReview(userId, courseId) {
    const existing = await ReviewRepository.findByUserAndCourse(userId, courseId);
    if (!existing) throw new Error('Đánh giá không tồn tại');

    return ReviewRepository.delete(userId, courseId);
  }
}

module.exports = new ReviewService();
