const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Signs a JWT containing the user's id and name.
// The token expires after 7 days — long enough to stay logged in, short enough to limit exposure.
function createToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/register
// Creates a new user account and immediately returns a JWT so the user
// is logged in right after signing up (no separate login step required).
exports.register = async (req, res, next) => {
    try {
        const user = new User({
            name:     req.body.name,
            email:    req.body.email,
            password: req.body.password
            // password is hashed by the User model's pre-save hook before hitting the DB
        });

        const savedUser = await user.save();
        const token = createToken(savedUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email }
        });
    } catch (error) {
        // MongoDB duplicate-key error — the email already exists in the database
        if (error.code === 11000) {
            return next(new AppError('This email is already registered', 400));
        }
        next(error);
    }
};

// POST /api/login
// Verifies the user's credentials and returns a JWT on success.
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return next(new AppError('User not found', 400));

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return next(new AppError('Wrong password, please try again', 400));

        const token = createToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        next(error);
    }
};
