export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
};
