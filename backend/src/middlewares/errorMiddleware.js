const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error details
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    // Default error status and message
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific database errors (example for pg)
    if (err.code === '23505') {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }

    res.status(statusCode).json({
        success: false,
        code: err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
        message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

module.exports = { errorHandler, notFoundHandler };
