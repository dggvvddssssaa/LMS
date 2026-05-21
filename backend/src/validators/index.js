const authValidators = require('./authValidators');
const courseValidators = require('./courseValidators');
const sessionValidators = require('./sessionValidators');
const enrollmentValidators = require('./enrollmentValidators');
const qaValidators = require('./qaValidators');
const progressValidators = require('./progressValidators');
const userValidators = require('./userValidators');
const materialValidators = require('./materialValidators');
const categoryValidators = require('./categoryValidators');
const sectionValidators = require('./sectionValidators');
const lessonValidators = require('./lessonValidators');
const assignmentValidators = require('./assignmentValidators');
const liveClassValidators = require('./liveClassValidators');
const notificationValidators = require('./notificationValidators');
const settingsValidators = require('./settingsValidators');

module.exports = {
  ...authValidators,
  ...courseValidators,
  ...sessionValidators,
  ...enrollmentValidators,
  ...qaValidators,
  ...progressValidators,
  ...userValidators,
  ...materialValidators,
  ...categoryValidators,
  ...sectionValidators,
  ...lessonValidators,
  ...assignmentValidators,
  ...liveClassValidators,
  ...notificationValidators,
  ...settingsValidators
};
