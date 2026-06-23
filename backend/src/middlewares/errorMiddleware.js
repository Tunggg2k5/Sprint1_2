export function notFoundMiddleware(req, res) {
  res.status(404).json({ message: `Khong tim thay API ${req.originalUrl}.` });
}

export function errorMiddleware(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  res.status(statusCode).json({
    message: error.message || "Loi he thong."
  });
}
