const constants = require('./constants');

// Standard response format
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
  return res.status(statusCode).json(response);
};

// Success response
const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

// Error response
const sendError = (res, message = 'Error', error = null, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message, null, error);
};

// Common response handlers
const responses = {
  ok: (res, message = 'Success', data = null) =>
    sendSuccess(res, message, data, constants.HTTP_STATUS.OK),

  created: (res, message = 'Created successfully', data = null) =>
    sendSuccess(res, message, data, constants.HTTP_STATUS.CREATED),

  badRequest: (res, message = 'Invalid request', error = null) =>
    sendError(res, message, error, constants.HTTP_STATUS.BAD_REQUEST),

  unauthorized: (res, message = 'Unauthorized access') =>
    sendError(res, message, null, constants.HTTP_STATUS.UNAUTHORIZED),

  forbidden: (res, message = 'Access forbidden') =>
    sendError(res, message, null, constants.HTTP_STATUS.FORBIDDEN),

  notFound: (res, message = 'Resource not found') =>
    sendError(res, message, null, constants.HTTP_STATUS.NOT_FOUND),

  conflict: (res, message = 'Conflict', error = null) =>
    sendError(res, message, error, constants.HTTP_STATUS.CONFLICT),

  serverError: (res, message = 'Internal server error', error = null) =>
    sendError(res, message, error, constants.HTTP_STATUS.INTERNAL_ERROR),
};

module.exports = { sendResponse, sendSuccess, sendError, ...responses };
