// Custom error class
// A normal JavaScript Error only has a message. This class adds a
// "statusCode" so we can throw errors that carry the right HTTP status
// (e.g. 404 for "not found", 403 for "forbidden").
// The global error handler reads these properties to build the response.
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);            // set the message on the base Error
        this.statusCode = statusCode;
        // Marks this as an error we created on purpose (an expected,
        // "operational" error) rather than an unexpected programming bug.
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;