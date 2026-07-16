const mongoose = require('mongoose');

/**
 * Connects Mongoose using DATABASE_URL and terminates startup on failure.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.info('Connected to MongoDB successfully!');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // a server without a database cannot serve requests
    }
};

module.exports = connectDB;
