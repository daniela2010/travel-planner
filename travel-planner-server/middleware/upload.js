const multer = require('multer');

// Multer upload middleware
// Multer parses "multipart/form-data" requests (the format used when a form
// uploads a file). Here we use MEMORY storage: the file is kept in RAM as a
// Buffer (req.file.buffer) instead of being written to disk, because we want
// to save the bytes directly into MongoDB.
const storage = multer.memoryStorage();

// Only allow image files. Multer calls this for every uploaded file.
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);  // accept the file
    } else {
        cb(new Error('Only image files are allowed'), false); // reject it
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // max 5 MB per image
});

module.exports = upload;