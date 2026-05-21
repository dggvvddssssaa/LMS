const prisma = require('../config/prisma');
const CourseRepository = require('../repositories/CourseRepository');
const LiveClassRepository = require('../repositories/LiveClassRepository');
const SectionRepository = require('../repositories/SectionRepository');
const LessonRepository = require('../repositories/LessonRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const AssignmentRepository = require('../repositories/AssignmentRepository');
const { hasRole } = require('../utils/roles');
const { slugifyVietnamese } = require('../utils/slugUtils');

class CourseService {
  normalizeCourseType(type) {
    if (!type) return 'video';
    if (type === 'recorded') return 'video';
    return type;
  }

  async generateUniqueCourseSlug(title, excludeId = null) {
    const base = slugifyVietnamese(title) || 'course';
    let slug = base;
    let i = 2;
    while (await CourseRepository.findBySlug(slug, excludeId)) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  async createCourse(courseData, user) {
    if (!hasRole(user.role, 'admin', 'instructor')) {
      throw new Error('Unauthorized to create courses');
    }

    const normalizedType = this.normalizeCourseType(courseData.type);
    const validTypes = ['video', 'live', 'hybrid'];
    if (normalizedType && !validTypes.includes(normalizedType)) {
      throw new Error('Invalid course type. Must be video, live, or hybrid');
    }

    let slug = courseData.slug;
    if (!slug && courseData.title) {
      slug = await this.generateUniqueCourseSlug(courseData.title);
    } else if (slug) {
      const existing = await CourseRepository.findBySlug(slug);
      if (existing) throw new Error('Slug already exists');
    }

    return prisma.$transaction(async () => {
      const newCourse = await CourseRepository.create({
        ...courseData,
        slug,
        type: normalizedType,
        instructor_id: user.id
      });

      if (courseData.categoryIds) {
        await CategoryRepository.setCourseCategories(newCourse.id, courseData.categoryIds);
      }

      if (newCourse.type === 'live' && courseData.live_class_data) {
        await LiveClassRepository.create({
          course_id: newCourse.id,
          ...courseData.live_class_data
        });
      }

      return newCourse;
    });
  }

  async getAllCourses(filters) {
    return CourseRepository.findAll(filters);
  }

  async getCourseById(id) {
    const course = await CourseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (course.type === 'live') {
      try {
        course.live_class_details = await LiveClassRepository.findByCourseId(id);
      } catch (e) {
        console.error('Error fetching live class details:', e.message);
        course.live_class_details = null;
      }
    }

    try {
      const sections = await SectionRepository.findByCourseId(id);
      for (let section of sections) {
        section.lessons = await LessonRepository.findBySectionId(section.id);
      }
      course.sections = sections;
      course.categories = await CategoryRepository.getCourseCategories(id);
    } catch (e) {
      console.error('Error fetching curriculum / categories:', e.message);
      course.sections = [];
      course.categories = [];
    }

    return course;
  }

  async getLearningOutline(courseId, studentId) {
    const course = await CourseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    const sections = await SectionRepository.findByCourseId(courseId);
    let totalLessons = 0;

    let progressData = null;
    if (studentId) {
      const ProgressService = require('./ProgressService');
      progressData = await ProgressService.getCourseProgress(studentId, courseId).catch(() => null);
    }

    for (let section of sections) {
      section.lessons = await LessonRepository.findBySectionId(section.id);

      for (let lesson of section.lessons) {
        try {
          lesson.assignments = await AssignmentRepository.getByLesson(lesson.id);
        } catch (e) {
          lesson.assignments = [];
        }
        totalLessons++;
      }

      try {
        section.assignments = await AssignmentRepository.getBySection(section.id);
      } catch (e) {
        section.assignments = [];
      }

      let sectionCompletedLessons = 0;
      if (progressData && progressData.lessons) {
        section.lessons.forEach(l => {
          if (progressData.lessons[l.id]?.isCompleted) sectionCompletedLessons++;
        });
      }
      section.completedLessons = sectionCompletedLessons;
      section.totalLessons = section.lessons.length;
      section.progressPercent = section.totalLessons > 0 ? Math.round((sectionCompletedLessons / section.totalLessons) * 100) : 0;
    }

    let finalAssignment = null;
    try {
      finalAssignment = await AssignmentRepository.getByCourseFinal(courseId);
    } catch (e) {
      console.error('Error fetching final assignment:', e.message);
    }

    let certificate = null;
    if (studentId) {
      certificate = await prisma.certificates.findFirst({
        where: { user_id: studentId, course_id: Number(courseId) }
      });
    }

    return {
      course,
      progress: progressData || { overallProgress: 0, completedLessons: 0, totalLessons },
      sections,
      finalAssignment,
      certificate
    };
  }

  async updateCourse(id, updateData, user) {
    const course = await CourseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (!hasRole(user.role, 'admin') && course.instructor_id !== user.id) {
      throw new Error('Unauthorized to edit this course');
    }

    const nextData = { ...updateData };
    if (nextData.type) nextData.type = this.normalizeCourseType(nextData.type);

    if (nextData.slug && nextData.slug !== course.slug) {
      const existing = await CourseRepository.findBySlug(nextData.slug, id);
      if (existing) throw new Error('Slug already exists');
    }

    if (nextData.categoryIds !== undefined) {
      await CategoryRepository.setCourseCategories(id, nextData.categoryIds);
      delete nextData.categoryIds;
    }

    return CourseRepository.update(id, nextData);
  }

  async deleteCourse(id, user) {
    const course = await CourseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (!hasRole(user.role, 'admin') && course.instructor_id !== user.id) {
      throw new Error('Unauthorized to delete this course');
    }

    return CourseRepository.delete(id);
  }
}

module.exports = new CourseService();
