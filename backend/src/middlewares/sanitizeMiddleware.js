const logger = require('../utils/logger');

const stripTags = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(stripTags);
  }
  if (value && typeof value === 'object' && value !== null) {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = stripTags(value[key]);
    }
    return sanitized;
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  const originalBody = JSON.stringify(req.body);
  req.body = stripTags(req.body);
  const cleanedBody = JSON.stringify(req.body);
  if (originalBody !== cleanedBody) {
    logger.warn(`XSS attempt blocked on ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = { sanitizeInput };
