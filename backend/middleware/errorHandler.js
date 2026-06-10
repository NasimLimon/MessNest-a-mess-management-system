const responses = require('../utils/responses');
const constants = require('../utils/constants');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return responses.badRequest(res, 'Validation failed', err.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return responses.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return responses.unauthorized(res, 'Token expired');
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return responses.conflict(res, 'Duplicate entry or constraint violation', err.message);
  }

  // Custom application errors
  if (err.statusCode && err.message) {
    return responses.sendError(res, err.message, err.details, err.statusCode);
  }

  // Default error
  return responses.serverError(res, 'Internal server error', err.message);
};

// Not found handler (should be last route)
const notFoundHandler = (req, res) => {
  responses.notFound(res, `Route ${req.path} not found`);
};

module.exports = { errorHandler, notFoundHandler };
