// backend/middlewares/errorMiddleware.js

// Centralized error handling middleware for Express
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific known errors first
  if (err?.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload is too large. Reduce image size/count or use image URLs.';
  } else if (err?.message?.startsWith('CORS blocked for origin:')) {
    statusCode = 403;
  }

  // Log error stack in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  const response = {
    success: false,
    message,
  };
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
