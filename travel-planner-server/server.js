require('dotenv').config(); // must load env vars before anything else
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Render/Heroku run the app behind a reverse proxy.
// trust proxy lets express-rate-limit see the real client IP instead of the proxy's.
app.set('trust proxy', 1);

// Helmet sets secure HTTP headers (XSS protection, clickjacking defense,
// MIME-sniffing prevention, HSTS). One line, big security win.
app.use(helmet());

// Allow requests only from the configured frontend origin.
// FRONTEND_URL is set as an environment variable in production.
// Falls back to localhost for local development.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting: general limit on every /api route,
// stricter limit on auth routes to block brute-force password guessing.
app.use('/api', apiLimiter);
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);

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

// PORT comes from the hosting platform in production (no hardcoded values)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
