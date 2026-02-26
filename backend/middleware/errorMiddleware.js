/**
 * Global Error Handling Middleware
 * Standardizes all API errors into a consistent structure:
 * {
 *   "status": "error",
 *   "message": "Human readable message",
 *   "error": { ... details } // Only in development
 * }
 */

const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error for internal tracking
    console.error(`[API ERROR] ${req.method} ${req.url}:`, err);

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    } else {
        // Production: Don't leak technical details
        res.status(err.statusCode).json({
            status: err.status,
            message: err.isOperational ? err.message : 'Something went very wrong!'
        });
    }
};

module.exports = errorMiddleware;
