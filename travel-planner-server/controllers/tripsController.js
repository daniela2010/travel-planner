const Trip     = require('../models/Trip');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');

/**
 * Loads a trip and verifies ownership.
 * @param {string} tripId MongoDB trip id.
 * @param {string} userId Authenticated user id.
 * @returns {Promise<object>} Owned Mongoose trip document.
 */
async function getOwnedTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.userId.toString() !== userId) throw new AppError('Not authorized to access this trip', 403);
    return trip;
}

/**
 * Lists the authenticated user's trips, newest first.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.getTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) {
        next(error);
    }
};

/**
 * Returns one owned trip and populates its user reference.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.getTripById = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.id, req.user.id); // ownership check first
        const trip = await Trip.findById(req.params.id).populate('userId', 'name email');
        res.json(trip);
    } catch (error) {
        next(error);
    }
};

/**
 * Creates a trip owned by the authenticated user.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
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

/**
 * Updates an owned trip.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
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

/**
 * Deletes an owned trip and its child activities.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
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
