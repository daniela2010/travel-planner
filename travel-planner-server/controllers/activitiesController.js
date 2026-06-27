const Activity = require('../models/Activity');
const Trip     = require('../models/Trip');
const AppError = require('../utils/AppError');

// Shared helper: confirm that the tripId exists and belongs to the requesting user.
// All activity routes pass through this to enforce ownership before touching any activity.
async function getOwnedTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError('Trip not found', 404);
    if (trip.userId.toString() !== userId) throw new AppError('Not authorized to access this trip', 403);
    return trip;
}

// GET /api/trips/:tripId/activities
// Returns all activities for a trip, sorted by day then time.
// Image data (imageData, imageType) is excluded from this query for performance —
// those fields have select:false in the schema and are fetched via the /image route.
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

// POST /api/trips/:tripId/activities
// Creates a new activity item inside the given trip.
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

// PUT /api/trips/:tripId/activities/:activityId
// Replaces all editable fields of an existing activity.
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

// DELETE /api/trips/:tripId/activities/:activityId
// Removes a single activity from the trip.
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

// POST /api/trips/:tripId/activities/:activityId/image
// Accepts an image file (multipart/form-data, field name "image") via Multer.
// Stores the raw bytes and mime type directly in MongoDB.
// After upload, sets hasImage:true so the frontend knows a photo exists
// without loading the binary data on every list request.
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

// GET /api/trips/:tripId/activities/:activityId/image
// Serves the raw image bytes with the correct Content-Type header.
// An <img src="...this URL..."> in the frontend will render the photo directly.
// We must explicitly select the hidden fields (imageData, imageType) here.
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
