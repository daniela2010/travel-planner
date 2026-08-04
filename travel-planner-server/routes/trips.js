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
// GET /api/trips      → getTrips
router.get('/',    authMiddleware, getTrips);
// GET /api/trips/:id  → getTripById
router.get('/:id', authMiddleware, getTripById);
// POST /api/trips      → createTrip
router.post('/',   authMiddleware, validate(tripSchema), createTrip);
// PUT /api/trips/:id  → updateTrip
router.put('/:id', authMiddleware, validate(tripSchema), updateTrip);
// DELETE /api/trips/:id  → deleteTrip
router.delete('/:id', authMiddleware, deleteTrip);

module.exports = router;
