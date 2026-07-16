const multer = require('multer');
const AppError = require('../utils/AppError');

// Multer upload middleware
// Multer parses "multipart/form-data" requests (the format used when a form
// uploads a file). Here we use MEMORY storage: the file is kept in RAM as a
// Buffer (req.file.buffer) instead of being written to disk, because we want
// to save the bytes directly into MongoDB.
const storage = multer.memoryStorage();

// Only allow image files. Multer calls this for every uploaded file.
// Rejecting with an AppError (statusCode 400) means the global error handler
// returns a proper 400 Bad Request instead of a generic 500.
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);  // accept the file
    } else {
        cb(new AppError('Only image files are allowed', 400), false); // reject it
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // max 5 MB per image
});

module.exports = upload;