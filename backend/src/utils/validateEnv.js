const logger = require('./logger');

/**
 * Validate required environment variables at startup.
 * Throws if critical variables are missing or use placeholder values.
 * Warns for optional but recommended variables.
 */
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // --- Required variables ---
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'MEDIASOUP_LISTEN_IP',
    'MEDIASOUP_ANNOUNCED_IP',
    'SEPAY_WEBHOOK_API_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // --- JWT_SECRET must not be a placeholder ---
  const jwtSecret = process.env.JWT_SECRET || '';
  const placeholders = [
    'CHANGE_ME',
    'supersecretjwtkeylmswebrtc',
    'changeme',
    'your_secret_here',
  ];
  if (placeholders.some((p) => jwtSecret.toLowerCase().includes(p.toLowerCase()))) {
    errors.push(
      'JWT_SECRET is set to a placeholder/default value. ' +
        'Please generate a strong random secret (at least 32 characters).'
    );
  }
  if (jwtSecret.length > 0 && jwtSecret.length < 16) {
    warnings.push('JWT_SECRET is very short. Recommend at least 32 characters.');
  }

  // --- DATABASE_URL must not contain placeholder password ---
  const dbUrl = process.env.DATABASE_URL || '';
  if (
    dbUrl.includes('YOUR_PASSWORD') ||
    dbUrl.includes('changeme')
  ) {
    errors.push(
      'DATABASE_URL contains a placeholder password. ' +
        'Please set the real database password in your .env file.'
    );
  }

  // --- Optional but recommended ---
  if (!process.env.REDIS_URL) {
    warnings.push('REDIS_URL is not set. Redis features will be unavailable.');
  }
  if (!process.env.CORS_ORIGIN) {
    warnings.push(
      'CORS_ORIGIN is not set. Defaulting to http://localhost:5173. ' +
        'Set this to your frontend URL(s) in production.'
    );
  }
  if (!process.env.PORT) {
    warnings.push('PORT is not set. Defaulting to 4000.');
  }

  // --- Report ---
  for (const w of warnings) {
    logger.warn(`[ENV] ${w}`);
  }

  if (errors.length > 0) {
    for (const e of errors) {
      logger.error(`[ENV] ${e}`);
    }
    throw new Error(
      `Environment validation failed with ${errors.length} error(s). ` +
        'See logs above. Fix your .env file and restart.'
    );
  }

  logger.info('[ENV] Environment validation passed.');
};

module.exports = validateEnv;
