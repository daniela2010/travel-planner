const Trip     = require('../models/Trip');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');

// Shared helper: load a trip and verify that it belongs to the requesting user.
// Throws an AppError (caught by the global error handler) instead of returning null,
// so every route that calls this gets ownership enforcement for free.
async function getOwnedTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.userId.toString() !== userId) throw new AppError('Not authorized to access this trip', 403);
    return trip;
}

// GET /api/trips
// Returns all trips that belong to the logged-in user (identified by the JWT payload).
exports.getTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ userId: req.user.id });
        res.json(trips);
    } catch (error) {
        next(error);
    }
};

// GET /api/trips/:id
// Returns a single trip — only if it belongs to the logged-in user.
exports.getTripById = async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);
        res.json(trip);
    } catch (error) {
        next(error);
    }
};

// POST /api/trips
// Creates a new trip and links it to the logged-in user.
exports.createTrip = async (req, res, next) => {
    try {
        const newTrip = new Trip({
            destination: req.body.destination,
            startDate:   req.body.startDate,
            endDate:     req.body.endDate,
            budget:      req.body.budget,
            userId:      req.user.id // taken from the JWT, not from the request body
        });

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        next(error);
    }
};

// PUT /api/trips/:id
// Updates a trip's fields — only if it belongs to the logged-in user.
exports.updateTrip = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.id, req.user.id); // ownership check

        const updated = await Trip.findByIdAndUpdate(
            req.params.id,
            {
                destination: req.body.destination,
                startDate:   req.body.startDate,
                endDate:     req.body.endDate,
                budget:      req.body.budget
            },
            { returnDocument: 'after', runValidators: true }
            // returnDocument: 'after' → returns the updated doc, not the original
            // runValidators: true → re-runs Mongoose schema validators on update
        );

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/trips/:id
// Deletes a trip and all of its activities (cascade delete).
exports.deleteTrip = async (req, res, next) => {
    try {
        const trip = await getOwnedTrip(req.params.id, req.user.id);
        await Activity.deleteMany({ tripId: trip._id }); // remove all child activities first
        await trip.deleteOne();
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        next(error);
    }
};
