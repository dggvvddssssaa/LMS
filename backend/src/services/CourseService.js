const CourseRepository = require('../repositories/CourseRepository');
const LiveClassRepository = require('../repositories/LiveClassRepository');
const SectionRepository = require('../repositories/SectionRepository');
const LessonRepository = require('../repositories/LessonRepository');
const { hasRole } = require('../utils/roles');
const db = require('../config/db');
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
      // Check if provided slug is unique
      const existing = await CourseRepository.findBySlug(slug);
      if (existing) {
        throw new Error('Slug already exists');
      }
    }

    // Use a transaction to ensure atomicity: course + categories + live_class
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const newCourse = await CourseRepository.create({
        ...courseData,
        slug,
        type: normalizedType,
        instructor_id: user.id
      }, client);

      if (courseData.categoryIds) {
        const CategoryRepository = require('../repositories/CategoryRepository');
        await CategoryRepository.setCourseCategories(newCourse.id, courseData.categoryIds, client);
      }

      if (newCourse.type === 'live' && courseData.live_class_data) {
        await LiveClassRepository.create({
          course_id: newCourse.id,
          ...courseData.live_class_data
        }, client);
      }

      await client.query('COMMIT');
      return newCourse;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getAllCourses(filters) {
    return await CourseRepository.findAll(filters);
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
    
    // Fetch curriculum structure (Sections & Lessons)
    try {
      const sections = await SectionRepository.findByCourseId(id);
      for (let section of sections) {
        section.lessons = await LessonRepository.findBySectionId(section.id);
      }
      course.sections = sections;
      
      const CategoryRepository = require('../repositories/CategoryRepository');
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

    const AssignmentRepository = require('../repositories/AssignmentRepository');
    const ProgressService = require('./ProgressService');

    // sections
    const sections = await SectionRepository.findByCourseId(courseId);
    let totalLessons = 0;
    
    // progress
    let progressData = null;
    if (studentId) {
       progressData = await ProgressService.getCourseProgress(studentId, courseId).catch(() => null);
    }
    
    for (let section of sections) {
      section.lessons = await LessonRepository.findBySectionId(section.id);
      
      // Get assignments for lessons
      for (let lesson of section.lessons) {
         try {
           lesson.assignments = await AssignmentRepository.getByLesson(lesson.id);
         } catch(e) {
           lesson.assignments = [];
         }
         totalLessons++;
      }
      
      try {
        section.assignments = await AssignmentRepository.getBySection(section.id);
      } catch(e) {
        section.assignments = [];
      }
      
      // Calculate section progress
      let sectionCompletedLessons = 0;
      if (progressData && progressData.lessons) {
         section.lessons.forEach(l => {
            if (progressData.lessons[l.id]?.isCompleted) {
               sectionCompletedLessons++;
            }
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

    // Get certificate info if any
    let certificate = null;
    if (studentId) {
       const certResult = await db.query('SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2', [studentId, courseId]);
       certificate = certResult.rows[0];
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
    if (nextData.type) {
      nextData.type = this.normalizeCourseType(nextData.type);
    }

    if (nextData.slug && nextData.slug !== course.slug) {
      const existing = await CourseRepository.findBySlug(nextData.slug, id);
      if (existing) {
        throw new Error('Slug already exists');
      }
    }

    // Handle categories update if provided
    if (nextData.categoryIds !== undefined) {
      const CategoryRepository = require('../repositories/CategoryRepository');
      await CategoryRepository.setCourseCategories(id, nextData.categoryIds);
      delete nextData.categoryIds; // Don't pass to basic update
    }

    return await CourseRepository.update(id, nextData);
  }

  async deleteCourse(id, user) {
    const course = await CourseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (!hasRole(user.role, 'admin') && course.instructor_id !== user.id) {
      throw new Error('Unauthorized to delete this course');
    }

    return await CourseRepository.delete(id);
  }
}

module.exports = new CourseService();
