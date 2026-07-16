const multer = require('multer');

// Global error handler
// Special Express middleware with FOUR parameters (err, req, res, next).
// Express calls it whenever a route passes an error to next(err).
// Having ONE place to handle errors keeps the routes clean.
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);

    // Multer throws its own error type for things like "file too large".
    // We translate it into a friendly 400 response.
    if (err instanceof multer.MulterError) {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Image is too large (max 5 MB)';
        }
        return res.status(400).json({ status: 'error', message });
    }

    // Mongoose CastError: the URL contained an id that is not a valid ObjectId
    // (e.g. /api/trips/abc). Without this it would fall through as a 500.
    if (err.name === 'CastError') {
        return res.status(400).json({ status: 'error', message: 'Invalid id format' });
    }

    // Mongoose ValidationError: a document failed the schema rules
    // (second line of defense after JOI).
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message).join(', ');
        return res.status(400).json({ status: 'error', message: messages });
    }

    // MongoDB duplicate-key error (e.g. registering an email that already exists)
    if (err.code === 11000) {
        return res.status(400).json({ status: 'error', message: 'This value is already registered' });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong on the server';

    res.status(statusCode).json({
        status: 'error',
        message: message
    });
};

module.exports = errorHandler;
