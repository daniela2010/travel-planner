const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/Auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/schemas');

// Public routes — no authentication required
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);

// Protected route — returns the logged-in user (used to restore the session on page load)
router.get('/me', authMiddleware, getMe);

module.exports = router;
