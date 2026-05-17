const CourseService = require('../services/CourseService');
const { normalizeYouTubeUrl, isYouTubeUrl, isValidYouTubeUrl } = require('../utils/youtube');

exports.createCourse = async (req, res) => {
  try {
    const { 
      title, description, thumbnail, type, price, live_class_data, is_published,
      slug, short_description, full_description, promo_video_url, language, certificate_enabled, tags, category_ids, level
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const courseData = { 
      title, description, thumbnail, type, price, live_class_data, is_published,
      slug, short_description, full_description, promo_video_url, language, certificate_enabled, tags, level
    };
    if (category_ids) {
      courseData.categoryIds = category_ids;
    }
    
    if (courseData.promo_video_url && isYouTubeUrl(courseData.promo_video_url)) {
      if (!isValidYouTubeUrl(courseData.promo_video_url)) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL for promo video' });
      }
      courseData.promo_video_url = normalizeYouTubeUrl(courseData.promo_video_url);
    }
    
    const newCourse = await CourseService.createCourse(courseData, req.user);
    
    res.status(201).json({ success: true, message: 'Course created successfully', data: newCourse });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.is_published !== undefined) filters.is_published = req.query.is_published === 'true';
    if (req.query.search) filters.search = req.query.search;
    if (req.query.sort) filters.sort = req.query.sort;
    if (req.query.order) filters.order = req.query.order;
    if (req.query.page) filters.page = req.query.page;
    if (req.query.limit) filters.limit = req.query.limit;

    const result = await CourseService.getAllCourses(filters);
    
    // Support both paginated (new) and legacy (array) response
    if (result.data && result.meta) {
      res.status(200).json({ success: true, count: result.data.length, data: result.data, meta: result.meta });
    } else {
      res.status(200).json({ success: true, count: result.length, data: result });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.id);
    
    // Protect draft courses from public access
    const user = req.user; // may be null for public routes
    const isAdmin = user?.role === 'admin';
    const isOwner = user && course.instructor_id === user.id;
    
    if (!course.is_published && !isAdmin && !isOwner) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.getLearningOutline = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const outline = await CourseService.getLearningOutline(req.params.id, userId);
    
    if (role === 'student') {
      const EnrollmentRepository = require('../repositories/EnrollmentRepository');
      const isEnrolled = await EnrollmentRepository.checkEnrollment(userId, req.params.id);
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'You must be enrolled to view the course content' });
      }
    } else if (role === 'instructor') {
      if (outline.course.instructor_id !== userId) {
        return res.status(403).json({ success: false, message: 'You do not own this course' });
      }
    }
    
    res.status(200).json({ success: true, data: outline });
  } catch (err) {
    console.error('getLearningOutline Error:', err);
    res.status(500).json({ 
      success: false, 
      code: "LEARNING_OUTLINE_LOAD_FAILED",
      message: "Không thể tải nội dung khóa học",
      details: err.message
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.category_ids !== undefined) {
      updateData.categoryIds = updateData.category_ids;
      delete updateData.category_ids;
    }
    
    if (updateData.promo_video_url && isYouTubeUrl(updateData.promo_video_url)) {
      if (!isValidYouTubeUrl(updateData.promo_video_url)) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL for promo video' });
      }
      updateData.promo_video_url = normalizeYouTubeUrl(updateData.promo_video_url);
    }
    
    const updatedUser = await CourseService.updateCourse(req.params.id, updateData, req.user);
    res.status(200).json({ success: true, message: 'Course updated', data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await CourseService.deleteCourse(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const updated = await CourseService.updateCourse(req.params.id, { 
      is_published: true, 
      status: 'published' 
    }, req.user);
    res.status(200).json({ success: true, message: 'Course published', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Admin endpoint: list ALL courses (including drafts).
 * Auth is enforced at the route level.
 */
exports.getAdminCourses = async (req, res) => {
  try {
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.is_published !== undefined) filters.is_published = req.query.is_published === 'true';
    if (req.query.search) filters.search = req.query.search;
    if (req.query.sort) filters.sort = req.query.sort;
    if (req.query.order) filters.order = req.query.order;
    if (req.query.page) filters.page = req.query.page;
    if (req.query.limit) filters.limit = req.query.limit;

    // Instructors only see their own courses, admins see all
    if (req.user.role === 'instructor') {
      filters.instructor_id = req.user.id;
    }

    const result = await CourseService.getAllCourses(filters);
    
    if (result.data && result.meta) {
      res.status(200).json({ success: true, count: result.data.length, data: result.data, meta: result.meta });
    } else {
      res.status(200).json({ success: true, count: result.length, data: result });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin endpoint: get course by ID including drafts.
 * Admin can see any course; instructor can only see their own.
 * Auth is enforced at the route level.
 */
exports.getAdminCourseById = async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.id);
    
    // Instructor can only view their own courses
    const isAdmin = req.user.role === 'admin';
    const isOwner = course.instructor_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this course.' });
    }
    
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.checkSlug = async (req, res) => {
  try {
    const { slug, excludeId } = req.query;
    if (!slug) return res.status(400).json({ success: false, message: 'Slug is required' });
    
    const CourseRepository = require('../repositories/CourseRepository');
    const existing = await CourseRepository.findBySlug(slug, excludeId);
    
    res.status(200).json({ success: true, isAvailable: !existing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.suggestSlug = async (req, res) => {
  try {
    const { title, excludeId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    
    const slug = await CourseService.generateUniqueCourseSlug(title, excludeId);
    res.status(200).json({ success: true, slug });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
