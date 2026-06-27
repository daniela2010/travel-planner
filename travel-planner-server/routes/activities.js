const express = require('express');
const router = express.Router();

const {
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadImage,
    getImage
} = require('../controllers/activitiesController');

const authMiddleware     = require('../middleware/Auth');
const validate           = require('../middleware/validate');
const { activitySchema } = require('../validators/schemas');
const upload             = require('../middleware/upload');

// Mounted at /api/trips in server.js, so the full URLs are:
//   GET    /api/trips/:tripId/activities
//   POST   /api/trips/:tripId/activities
//   PUT    /api/trips/:tripId/activities/:activityId
//   DELETE /api/trips/:tripId/activities/:activityId
//   POST   /api/trips/:tripId/activities/:activityId/image
//   GET    /api/trips/:tripId/activities/:activityId/image
router.get('/:tripId/activities',
    authMiddleware, getActivities);

router.post('/:tripId/activities',
    authMiddleware, validate(activitySchema), createActivity);

router.put('/:tripId/activities/:activityId',
    authMiddleware, validate(activitySchema), updateActivity);

router.delete('/:tripId/activities/:activityId',
    authMiddleware, deleteActivity);

router.post('/:tripId/activities/:activityId/image',
    authMiddleware, upload.single('image'), uploadImage);

router.get('/:tripId/activities/:activityId/image',
    authMiddleware, getImage);

module.exports = router;
