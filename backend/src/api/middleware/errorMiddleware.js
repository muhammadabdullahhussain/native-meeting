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

    // Standard Response Format
    const response = {
        success: false,
        status: err.status,
        message: err.message
    };

    // Log the error for internal tracking
    if (err.statusCode === 500) {
        console.error(`[CRITICAL ERROR] ${req.method} ${req.url}:`, err);
    } else {
        console.log(`[API ERROR] ${req.method} ${req.url} (${err.statusCode}): ${err.message}`);
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.error = err;
        return res.status(err.statusCode).json(response);
    }

    // Production: Don't leak technical details unless operational
    if (!err.isOperational) {
        response.message = 'Something went very wrong!';
    }

    res.status(err.statusCode).json(response);
};

module.exports = errorMiddleware;
