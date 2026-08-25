const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Ruta no encontrada: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
};

module.exports = { notFound, errorHandler };
