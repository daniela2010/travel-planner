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
const upload = require('./middleware/upload'); // Multer

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
app.post('/api/register', validate(registerSchema), async (req, res, next) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
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

app.get('/api/trips', authMiddleware, async (req, res, next) => {
    try {
        const trips = await Trip.find({ userId: req.user.id });
        res.json(trips);
    } catch (error) {
        next(error);
    }
});

app.get('/api/trips/:id', authMiddleware, async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);
        res.json(trip);
    } catch (error) {
        next(error);
    }
});

// UPDATE (edit) a trip
app.put('/api/trips/:id', authMiddleware, validate(tripSchema), async (req, res, next) => {
    try {
        // Ownership check: make sure this trip belongs to the logged-in user.
        await getOwnedTrip(req.params.id, req.user.id);

        const updated = await Trip.findByIdAndUpdate(
            req.params.id,
            {
                destination: req.body.destination,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                budget: req.body.budget
            },
            { returnDocument: 'after', runValidators: true }
        );

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

app.delete('/api/trips/:id', authMiddleware, async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);
        await Activity.deleteMany({ tripId: trip._id });
        await trip.deleteOne();
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// ACTIVITY ROUTES (protected, nested under a trip)
// Get all activities for a trip (image bytes are NOT included - see model)
app.get('/api/trips/:tripId/activities', authMiddleware, async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);
        const activities = await Activity.find({ tripId: req.params.tripId }).sort({ day: 1, time: 1 });
        res.json(activities);
    } catch (error) {
        next(error);
    }
});

// Create a new activity
app.post('/api/trips/:tripId/activities', authMiddleware, validate(activitySchema), async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

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

// UPDATE (edit) an activity: completes full CRUD
app.put('/api/trips/:tripId/activities/:activityId', authMiddleware, validate(activitySchema), async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        // findOneAndUpdate finds the activity and applies the new values.
        // { returnDocument: 'after' } returns the UPDATED document (not the old one).
        // { runValidators: true } re-checks the model's rules on update.
        const updated = await Activity.findOneAndUpdate(
            { _id: req.params.activityId, tripId: req.params.tripId },
            {
                day: req.body.day,
                time: req.body.time,
                title: req.body.title,
                type: req.body.type,
                notes: req.body.notes
            },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updated) {
            return next(new AppError('Activity not found', 404));
        }

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// Delete a single activity
app.delete('/api/trips/:tripId/activities/:activityId', authMiddleware, async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const activity = await Activity.findOne({
            _id: req.params.activityId,
            tripId: req.params.tripId
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

// UPLOAD a photo for an activity (Multer)
// upload.single('image') parses one file from a field named "image".
// After it runs, the file is available at req.file (with .buffer + .mimetype).
app.post('/api/trips/:tripId/activities/:activityId/image', authMiddleware, upload.single('image'), async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        if (!req.file) {
            return next(new AppError('No image file was uploaded', 400));
        }

        // Save the image as two top-level fields. Top-level Buffer fields
        // persist reliably (a nested "image.data" with select:false did not).
        const updated = await Activity.findOneAndUpdate(
            { _id: req.params.activityId, tripId: req.params.tripId },
            {
                $set: {
                    imageData: req.file.buffer,
                    imageType: req.file.mimetype,
                    hasImage: true
                }
            },
            { returnDocument: 'after' }
        );

        if (!updated) {
            return next(new AppError('Activity not found', 404));
        }

        res.json({ message: 'Image uploaded successfully', hasImage: true });
    } catch (error) {
        next(error);
    }
});

// SERVE an activity's photo back
// Returns the raw image with the correct Content-Type so an <img> tag can
// point straight at this URL. We must explicitly select the hidden fields.
app.get('/api/trips/:tripId/activities/:activityId/image', authMiddleware, async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const activity = await Activity.findOne({
            _id: req.params.activityId,
            tripId: req.params.tripId
        }).select('+imageData +imageType'); // include the hidden image fields

        if (!activity || !activity.imageData) {
            return next(new AppError('Image not found', 404));
        }

        res.set('Content-Type', activity.imageType);
        res.send(activity.imageData);
    } catch (error) {
        next(error);
    }
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});