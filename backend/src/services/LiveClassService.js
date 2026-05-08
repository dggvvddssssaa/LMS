const LiveClassRepository = require('../repositories/LiveClassRepository');
const CourseRepository = require('../repositories/CourseRepository');
const { hasRole } = require('../utils/roles');

class LiveClassService {
  async getLiveClassDetails(id) {
    const liveClass = await LiveClassRepository.findById(id);
    if (!liveClass) throw new Error('Live class not found');
    return liveClass;
  }

  async getLiveClassByCourseId(courseId) {
    const liveClass = await LiveClassRepository.findByCourseId(courseId);
    return liveClass;
  }

  async createLiveClass(data) {
    return await LiveClassRepository.create(data);
  }

  async updateLiveClass(id, updateData, user) {
    const liveClass = await LiveClassRepository.findById(id);
    if (!liveClass) throw new Error('Live class not found');

    const course = await CourseRepository.findById(liveClass.course_id);
    if (!hasRole(user.role, 'admin') && course.instructor_id !== user.id) {
      throw new Error('Unauthorized to edit this live class');
    }

    return await LiveClassRepository.update(id, updateData);
  }

  async getActiveRooms() {
    return await LiveClassRepository.findActiveRooms();
  }
}

module.exports = new LiveClassService();
