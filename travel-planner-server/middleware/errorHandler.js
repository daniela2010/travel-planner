// Global error handler
// This is a special Express middleware: it has FOUR parameters
// (err, req, res, next). Express recognizes that signature and calls it
// whenever a route passes an error to next(err), or an async route throws.
//
// Having ONE place to handle errors means our routes stay clean: they just
// throw or pass errors, and this function decides what the client sees.
const errorHandler = (err, req, res, next) => {
    // Log the full error on the server for our own debugging.
    console.error('Error:', err.message);

    // If we created the error on purpose (AppError), it has a statusCode.
    // Otherwise it's an unexpected error -> default to 500 (server error).
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong on the server';

    res.status(statusCode).json({
        status: 'error',
        message: message
    });
};

module.exports = errorHandler;