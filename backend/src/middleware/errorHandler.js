export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled request error:', err);
  
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
};
