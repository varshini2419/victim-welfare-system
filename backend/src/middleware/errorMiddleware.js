const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  if (
    err.name === 'MulterError' ||
    err.message?.includes('allowed') ||
    err.message?.includes('Images only') ||
    err.message?.includes('File too large') ||
    err.message?.includes('validation') ||
    err.name === 'ValidationError'
  ) {
    statusCode = 400;
  }
  
  console.error(`[Error] ${err.message}`);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = { notFoundHandler, errorHandler };
