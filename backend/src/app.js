const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const progressRoutes = require('./routes/progressRoutes');
const qaRoutes = require('./routes/qaRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const materialRoutes = require('./routes/materialRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const certificateTemplateRoutes = require('./routes/certificateTemplateRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// Request Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased for admin operations
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Routes
app.get('/', (req, res) => res.send('LMS WebRTC API is running'));
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/certificate-templates', certificateTemplateRoutes);
app.use('/api/webhooks', webhookRoutes);

// Admin-prefixed routes — dedicated admin routes with mandatory auth
const adminCourseRoutes = require('./routes/adminCourseRoutes');
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/sections', sectionRoutes);
app.use('/api/admin/lessons', lessonRoutes);
app.use('/api/admin/assignments', assignmentRoutes);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
