/**
 * Formats standardized JSON success response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta })
  };
  return res.status(statusCode).json(response);
};

/**
 * Formats standardized JSON error response
 */
const sendError = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
      ...(errors && { details: errors })
    }
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};

