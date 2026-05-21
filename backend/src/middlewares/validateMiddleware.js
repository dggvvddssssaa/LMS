const logger = require('../utils/logger');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      logger.warn(`Validation failed: ${JSON.stringify(errors)}`);
      return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }
    req[source] = result.data;
    next();
  };
};

const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = { validate, validateQuery, validateParams };
