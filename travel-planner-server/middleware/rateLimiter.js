const rateLimit = require('express-rate-limit');

// Rate limiting middleware.
// Limits how many requests a single IP can make in a time window.
// This protects the API against brute-force attacks and abuse.

// General limiter — applies to all /api routes.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // max 100 requests per IP per window
    standardHeaders: true,    // return rate limit info in the RateLimit-* headers
    legacyHeaders: false,     // disable the deprecated X-RateLimit-* headers
    message: { status: 'error', message: 'Too many requests, please try again after 15 minutes.' }
});

// Stricter limiter for the auth routes (register/login).
// Prevents brute-force password guessing attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // max 20 auth attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many login attempts, please try again later.' }
});

module.exports = { apiLimiter, authLimiter };
