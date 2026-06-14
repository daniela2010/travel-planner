const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on('error', error => { console.error('Error connecting to MongoDB:', error); });
db.once('open', () => { console.log('Connected to MongoDB successfully!'); });

// Models
const User = require('./models/User');
const Trip = require('./models/Trip');

// Middleware
const authMiddleware = require('./middleware/Auth');
const validate = require('./middleware/validate');
const errorHandler = require('./middleware/errorHandler');

// Validation schemas + custom error class
const { registerSchema, loginSchema, tripSchema } = require('./validators/schemas');
const AppError = require('./utils/AppError');

// Helper: create a signed JWT for a given user.
function createToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// AUTH ROUTES (public)
// Note: `validate(...)` runs BEFORE the handler. If the body is invalid,
// it responds with 400 and the handler never runs.
// We also pass any caught error to next(error) so the GLOBAL error handler
// (at the bottom) deals with it, instead of formatting errors here.
// Register a new user
app.post('/api/register', validate(registerSchema), async (req, res, next) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password // hashed automatically by the model's pre-save hook
        });

        const savedUser = await user.save();
        const token = createToken(savedUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email }
        });
    } catch (error) {
        // Turn the Mongo duplicate-key error into a clean, expected error.
        if (error.code === 11000) {
            return next(new AppError('This email is already registered', 400));
        }
        next(error); // anything else -> global handler
    }
});

// Login an existing user
app.post('/api/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            // Throw an expected error with the right status code.
            return next(new AppError('User not found', 400));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new AppError('Wrong password, please try again', 400));
        }

        const token = createToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        next(error);
    }
});

// TRIP ROUTES (protected)
// Create a new trip
app.post('/api/trips', authMiddleware, validate(tripSchema), async (req, res, next) => {
    try {
        const newTrip = new Trip({
            destination: req.body.destination,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            budget: req.body.budget,
            userId: req.user.id
        });

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        next(error);
    }
});

// Get all trips that belong to the logged-in user
app.get('/api/trips', authMiddleware, async (req, res, next) => {
    try {
        const trips = await Trip.find({ userId: req.user.id });
        res.json(trips);
    } catch (error) {
        next(error);
    }
});

// Delete a trip (only if it belongs to the logged-in user)
app.delete('/api/trips/:id', authMiddleware, async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return next(new AppError('Trip not found', 404));
        }

        if (trip.userId.toString() !== req.user.id) {
            return next(new AppError('Not authorized to delete this trip', 403));
        }

        await trip.deleteOne();
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// GLOBAL ERROR HANDLER
// Must be registered AFTER all routes. Any error passed to next(err)
// anywhere above ends up here and gets a consistent JSON response.
app.use(errorHandler);

// Start the server (always last)
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});