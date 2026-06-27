const express = require('express');
const router = express.Router();

const {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip
} = require('../controllers/tripsController');

const authMiddleware = require('../middleware/Auth');
const validate       = require('../middleware/validate');
const { tripSchema } = require('../validators/schemas');

// Mounted at /api/trips in server.js, so:
//   GET    /api/trips      → getTrips
//   GET    /api/trips/:id  → getTripById
//   POST   /api/trips      → createTrip
//   PUT    /api/trips/:id  → updateTrip
//   DELETE /api/trips/:id  → deleteTrip
router.get('/',    authMiddleware,                       getTrips);
router.get('/:id', authMiddleware,                       getTripById);
router.post('/',   authMiddleware, validate(tripSchema), createTrip);
router.put('/:id', authMiddleware, validate(tripSchema), updateTrip);
router.delete('/:id', authMiddleware,                    deleteTrip);

module.exports = router;
