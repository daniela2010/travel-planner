const Activity = require('../models/Activity');
const Trip     = require('../models/Trip');
const AppError = require('../utils/AppError');

/**
 * Loads a trip and verifies that it belongs to the authenticated user.
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
 * Lists an owned trip's activities sorted by day and time.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.getActivities = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);
        const activities = await Activity
            .find({ tripId: req.params.tripId })
            .sort({ day: 1, time: 1 });
        res.json(activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Creates an activity in an owned trip.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.createActivity = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const newActivity = new Activity({
            tripId: req.params.tripId,
            day:    req.body.day,
            time:   req.body.time,
            title:  req.body.title,
            type:   req.body.type,
            notes:  req.body.notes
        });

        const savedActivity = await newActivity.save();
        res.status(201).json(savedActivity);
    } catch (error) {
        next(error);
    }
};

/**
 * Updates an activity in an owned trip.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.updateActivity = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const updated = await Activity.findOneAndUpdate(
            { _id: req.params.activityId, tripId: req.params.tripId },
            {
                day:   req.body.day,
                time:  req.body.time,
                title: req.body.title,
                type:  req.body.type,
                notes: req.body.notes
            },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updated) return next(new AppError('Activity not found', 404));
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes an activity from an owned trip.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.deleteActivity = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const activity = await Activity.findOne({
            _id:    req.params.activityId,
            tripId: req.params.tripId
        });

        if (!activity) return next(new AppError('Activity not found', 404));

        await activity.deleteOne();
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Stores an uploaded activity image directly in MongoDB.
 * @param {import('express').Request} req Express request with req.file.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.uploadImage = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        if (!req.file) return next(new AppError('No image file was uploaded', 400));

        // Stored as two top-level fields rather than a nested object.
        // Top-level Buffer fields persist reliably with Mongoose; nested select:false objects did not.
        const updated = await Activity.findOneAndUpdate(
            { _id: req.params.activityId, tripId: req.params.tripId },
            { $set: { imageData: req.file.buffer, imageType: req.file.mimetype, hasImage: true } },
            { returnDocument: 'after' }
        );

        if (!updated) return next(new AppError('Activity not found', 404));
        res.json({ message: 'Image uploaded successfully', hasImage: true });
    } catch (error) {
        next(error);
    }
};

/**
 * Removes an activity image from MongoDB.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.deleteImage = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const updated = await Activity.findOneAndUpdate(
            { _id: req.params.activityId, tripId: req.params.tripId },
            { $unset: { imageData: '', imageType: '' }, $set: { hasImage: false } },
            { returnDocument: 'after' }
        );

        if (!updated) return next(new AppError('Activity not found', 404));
        res.json({ message: 'Image deleted successfully', hasImage: false });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns an activity image with its stored content type.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express error callback.
 * @returns {Promise<void>}
 */
exports.getImage = async (req, res, next) => {
    try {
        await getOwnedTrip(req.params.tripId, req.user.id);

        const activity = await Activity
            .findOne({ _id: req.params.activityId, tripId: req.params.tripId })
            .select('+imageData +imageType'); // override select:false to include image fields

        if (!activity || !activity.imageData) {
            return next(new AppError('Image not found', 404));
        }

        res.set('Content-Type', activity.imageType);
        res.send(activity.imageData);
    } catch (error) {
        next(error);
    }
};
