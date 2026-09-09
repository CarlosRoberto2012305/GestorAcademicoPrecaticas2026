module.exports = (err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error('Error:', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  res.status(statusCode).json({
    ok: false,
    message: statusCode === 500 ? 'Error interno del servidor.' : err.message,
  });
};
