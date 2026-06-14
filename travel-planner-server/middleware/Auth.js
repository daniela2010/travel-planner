const jwt = require('jsonwebtoken');

// --- Authentication middleware ---
// This function runs BEFORE a protected route handler.
// It checks that the request carries a valid JWT token.
// If valid, it attaches the user info to req.user and lets the request continue.
// If not, it stops the request with a 401 (Unauthorized) error.
const authMiddleware = (req, res, next) => {
    // The token is sent by the client in the "Authorization" header,
    // in the format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Remove the "Bearer " prefix to get only the token string.
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using our secret key.
        // If the token was tampered with or expired, this throws an error.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded payload (e.g. user id and name) to the request,
        // so the next route handler knows WHO is making the request.
        req.user = decoded;
        next(); // everything is fine -> continue to the actual route
    } catch (error) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;