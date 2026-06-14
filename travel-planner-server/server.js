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

// Import our models
const User = require('./models/User');
const Trip = require('./models/Trip');

// Import the JWT authentication middleware
const authMiddleware = require('./middleware/Auth');

// Helper: create a signed JWT for a given user.
// The payload holds non-sensitive info we want to read later (NEVER the password).
function createToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name }, // payload
        process.env.JWT_SECRET,            // secret key from .env
        { expiresIn: '7d' }                // token is valid for 7 days
    );
}

// ----------------------------------------------------------------------------
// AUTH ROUTES (public - no token needed)
// ----------------------------------------------------------------------------

// Register a new user
app.post('/api/register', async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password // will be hashed automatically by the model's pre-save hook
        });

        const savedUser = await user.save();

        // Issue a token right away so the user is logged in after registering.
        const token = createToken(savedUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email }
        });
    } catch (error) {
        // Handle the "email already exists" case nicely (Mongo duplicate key error code is 11000)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This email is already registered' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Login an existing user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: find the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Step 2: compare the typed password with the stored HASH (using bcrypt)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Wrong password, please try again' });
        }

        // Step 3: everything is correct -> issue a JWT token
        const token = createToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ----------------------------------------------------------------------------
// TRIP ROUTES (protected - authMiddleware runs first on every request)
// Notice: the user id now comes from req.user (the verified token),
// NOT from the request body/params. This is what makes it secure.
// ----------------------------------------------------------------------------

// Create a new trip
app.post('/api/trips', authMiddleware, async (req, res) => {
    try {
        const newTrip = new Trip({
            destination: req.body.destination,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            budget: req.body.budget,
            userId: req.user.id // taken from the verified token, not from the client
        });

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all trips that belong to the logged-in user
app.get('/api/trips', authMiddleware, async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.user.id });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a trip (only if it belongs to the logged-in user)
app.delete('/api/trips/:id', authMiddleware, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Ownership check: a user must not be able to delete someone else's trip.
        // .toString() converts the Mongo ObjectId to a string so we can compare it.
        if (trip.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this trip' });
        }

        await trip.deleteOne();
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start the server (this should always be the LAST thing in the file)
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});