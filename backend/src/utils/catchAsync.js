/**
 * CatchAsync Wrapper
 * Eliminates the need for try-catch blocks in route handlers.
 * Automatically catches errors and passes them to the global error middleware.
 */
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
