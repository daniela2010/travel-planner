const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Allow requests only from the configured frontend origin.
// FRONTEND_URL is set as an environment variable in production.
// Falls back to localhost for local development.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB successfully!'));

// Mount route files.
// auth routes stay at /api (they use /register and /login paths internally).
// trips and activities both mount at /api/trips — the activity router adds
// /:tripId/activities/... on top of that base path.
app.use('/api', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/trips', require('./routes/activities'));

// Global error handler — must be registered AFTER all routes
app.use(require('./middleware/errorHandler'));

app.listen(5000, () => console.log('Server running on port 5000'));