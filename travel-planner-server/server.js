// server.js — the entry point that starts the HTTP listener.
// All app configuration (middleware, routes, error handling) lives in app.js;
// the database connection logic lives in config/db.js.
const app = require('./app');
const connectDB = require('./config/db');

// PORT comes from the hosting platform in production (no hardcoded values)
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start accepting requests.
connectDB().then(() => {
    app.listen(PORT, () => console.info(`Server running on port ${PORT}`));
});
