/**
 * Centralized JWT secret accessor.
 * Throws immediately if JWT_SECRET is not configured,
 * preventing silent fallback to a hardcoded value.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'Server cannot sign or verify tokens without it. ' +
      'Please set JWT_SECRET in your .env file.'
    );
  }
  return secret;
};

module.exports = { getJwtSecret };
