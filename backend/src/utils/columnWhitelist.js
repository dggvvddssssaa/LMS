/**
 * Column whitelist for dynamic UPDATE queries.
 * Prevents SQL column injection and mass-assignment attacks
 * by only allowing known-safe column names through.
 */

const WHITELISTS = {
  courses: [
    'title', 'description', 'thumbnail', 'type', 'price',
    'is_published', 'sale_price', 'duration_total_minutes',
    'video_count', 'what_you_will_learn'
  ],
  sections: [
    'title', 'order_index'
  ],
  lessons: [
    'title', 'content_type', 'content_url', 'content_text', 'order_index',
    'video_url', 'description'
  ],
  course_materials: [
    'title', 'file_url', 'file_type'
  ],
  live_classes: [
    'schedule_config', 'total_sessions', 'max_students', 'status'
  ]
};

/**
 * Filters an update data object to only include whitelisted columns.
 * @param {string} tableName - The database table name
 * @param {object} rawData - Raw update data from the request
 * @returns {object} Filtered data with only allowed columns
 */
const sanitizeUpdateData = (tableName, rawData) => {
  const whitelist = WHITELISTS[tableName];
  if (!whitelist) {
    throw new Error(`No column whitelist defined for table: ${tableName}`);
  }

  const sanitized = {};
  for (const key of Object.keys(rawData)) {
    if (whitelist.includes(key)) {
      sanitized[key] = rawData[key];
    }
  }
  return sanitized;
};

module.exports = { sanitizeUpdateData, WHITELISTS };
