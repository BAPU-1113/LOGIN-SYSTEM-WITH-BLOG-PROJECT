/**
 * Centralized Error Handling Middleware
 * Catches Mongoose errors, CastErrors, Duplicate keys, and unhandled errors
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error stack in development for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Resource not found with id of '${err.value}'`;
    return res.status(404).json({
      success: false,
      message,
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    return res.status(409).json({
      success: false,
      message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Fallback internal server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'An unexpected internal server error occurred',
  });
};

/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFound,
};
