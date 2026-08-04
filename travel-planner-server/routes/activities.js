const express = require('express');
const router = express.Router();

const {
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadImage,
    deleteImage,
    getImage
} = require('../controllers/activitiesController');

const authMiddleware     = require('../middleware/Auth');
const validate           = require('../middleware/validate');
const { activitySchema } = require('../validators/schemas');
const upload             = require('../middleware/upload');

// Mounted at /api/trips in server.js, so the full URLs are:
// GET /api/trips/:tripId/activities
router.get('/:tripId/activities',
    authMiddleware, getActivities);
// POST /api/trips/:tripId/activities
router.post('/:tripId/activities',
    authMiddleware, validate(activitySchema), createActivity);
// PUT /api/trips/:tripId/activities/:activityId
router.put('/:tripId/activities/:activityId',
    authMiddleware, validate(activitySchema), updateActivity);
// DELETE /api/trips/:tripId/activities/:activityId
router.delete('/:tripId/activities/:activityId',
    authMiddleware, deleteActivity);
// POST /api/trips/:tripId/activities/:activityId/image
router.post('/:tripId/activities/:activityId/image',
    authMiddleware, upload.single('image'), uploadImage);
// DELETE /api/trips/:tripId/activities/:activityId/image
router.delete('/:tripId/activities/:activityId/image',
    authMiddleware, deleteImage);
// GET /api/trips/:tripId/activities/:activityId/image
router.get('/:tripId/activities/:activityId/image',
    authMiddleware, getImage);

module.exports = router;
