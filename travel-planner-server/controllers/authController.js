const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Signs a JWT containing the user's id and name.
 * @param {object} user Mongoose user document.
 * @returns {string} Signed JWT that expires after seven days.
 */
function createToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Registers a user and returns a JWT for the new account.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
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

/**
 * Verifies user credentials and returns a JWT.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // password has select:false on the schema, so we must explicitly
        // opt back in here — the only query in the app that needs the hash.
        const user = await User.findOne({ email }).select('+password');
        if (!user) return next(new AppError('Invalid email or password', 401));

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return next(new AppError('Invalid email or password', 401));

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

/**
 * Returns the user represented by the verified JWT.
 * @param {import('express').Request} req Express request with req.user.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id); // password excluded by select:false
        if (!user) return next(new AppError('User not found', 404));

        res.json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        next(error);
    }
};
