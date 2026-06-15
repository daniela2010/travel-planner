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
const Activity = require('./models/Activity');

// Middleware
const authMiddleware = require('./middleware/Auth');
const validate = require('./middleware/validate');
const errorHandler = require('./middleware/errorHandler');

// Validation schemas + custom error class
const { registerSchema, loginSchema, tripSchema, activitySchema } = require('./validators/schemas');
const AppError = require('./utils/AppError');

// Helper: create a signed JWT for a given user.
function createToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Helper: load a trip and make sure it belongs to the logged-in user.
// Returns the trip if OK, or throws an AppError. Reused by the activity routes.
async function getOwnedTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
        throw new AppError('Trip not found', 404);
    }
    if (trip.userId.toString() !== userId) {
        throw new AppError('Not authorized to access this trip', 403);
    }
    return trip;
}

// AUTH ROUTES (public)

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
        if (error.code === 11000) {
            return next(new AppError('This email is already registered', 400));
        }
        next(error);
    }
});

// Login an existing user
app.post('/api/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
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

// Get a SINGLE trip by id (used by the TripPlanner screen header)
app.get('/api/trips/:id', authMiddleware, async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);
        res.json(trip);
    } catch (error) {
        next(error);
    }
});

// Delete a trip (and all of its activities)
app.delete('/api/trips/:id', authMiddleware, async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);

        // Clean up: remove the trip's activities too, so we don't leave orphans.
        await Activity.deleteMany({ tripId: trip._id });
        await trip.deleteOne();

        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// ACTIVITY ROUTES (protected, nested under a trip)
// URL pattern: /api/trips/:tripId/activities
// Every route first checks that the trip belongs to the logged-in user.

// Get all activities for a given trip
app.get('/api/trips/:tripId/activities', authMiddleware, async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id); // ownership check
        const activities = await Activity.find({ tripId: req.params.tripId }).sort({ day: 1, time: 1 });
        res.json(activities);
    } catch (error) {
        next(error);
    }
});

// Create a new activity inside a trip
app.post('/api/trips/:tripId/activities', authMiddleware, validate(activitySchema), async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id); // ownership check

        const newActivity = new Activity({
            tripId: req.params.tripId,
            day: req.body.day,
            time: req.body.time,
            title: req.body.title,
            type: req.body.type,
            notes: req.body.notes
        });

        const savedActivity = await newActivity.save();
        res.status(201).json(savedActivity);
    } catch (error) {
        next(error);
    }
});

// Delete a single activity
app.delete('/api/trips/:tripId/activities/:activityId', authMiddleware, async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id); // ownership check

        const activity = await Activity.findOne({
            _id: req.params.activityId,
            tripId: req.params.tripId // make sure the activity really belongs to this trip
        });

        if (!activity) {
            return next(new AppError('Activity not found', 404));
        }

        await activity.deleteOne();
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// GLOBAL ERROR HANDLER (must be after all routes)
app.use(errorHandler);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});