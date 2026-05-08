const CourseService = require('../services/CourseService');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, thumbnail, type, price, live_class_data, is_published } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const courseData = { title, description, thumbnail, type, price, live_class_data, is_published };
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

    const courses = await CourseService.getAllCourses(filters);
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.id);
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updatedUser = await CourseService.updateCourse(req.params.id, req.body, req.user);
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

