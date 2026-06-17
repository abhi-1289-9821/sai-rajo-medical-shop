const multer = require('multer');

const errorMiddleware = (err, req, res, next) => {
  console.error('Centralized Error Handler:', err);

  // Handle Multer upload limits/exceptions
  if (err instanceof multer.MulterError) {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size limit exceeded. Prescriptions must be under 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field encountered.';
    } else {
      message = err.message;
    }
    
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Catch custom file type filter errors passed from Multer callback
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Only JPEG, PNG, WEBP, and PDF'))) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // General server errors
  const statusCode = err.statusCode || 500;
  const responseMessage = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    // Stack trace is masked in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
