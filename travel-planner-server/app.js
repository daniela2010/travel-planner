require('dotenv').config(); // must load env vars before anything else
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// app.js configures the Express application (middleware + routes).
// server.js is the file that actually starts listening.
// Keeping them separate makes the app easier to test and reason about.
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

// Mount route files.
// auth routes stay at /api (they use /register and /login paths internally).
// trips and activities both mount at /api/trips — the activity router adds
// /:tripId/activities/... on top of that base path.
app.use('/api', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/trips', require('./routes/activities'));

// JSON 404 for any unknown /api route — instead of Express's default HTML page.
app.use('/api', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler — must be registered AFTER all routes
app.use(require('./middleware/errorHandler'));

module.exports = app;
