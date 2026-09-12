/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler]", err.message);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";

  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
