/**
 * src/middleware/error.middleware.js
 * Global Express error handler.
 * Catches errors thrown/passed by any route handler and returns a standardized JSON error.
 */

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Creates an error object with a custom status code.
 * Usage: throw createError(404, 'Resource not found')
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };
