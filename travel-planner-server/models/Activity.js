const mongoose = require('mongoose');

// --- Activity model ---
// An Activity is a single item in a trip's itinerary:
// a flight, a hotel check-in, a restaurant booking, an attraction, etc.
// Each Activity belongs to ONE Trip (and through it, to one User).
// This gives us a nested relationship: User -> Trip -> Activity.
const activitySchema = new mongoose.Schema({
    // Link to the trip this activity belongs to (relationship between collections).
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    // Which day of the trip (1, 2, 3, ...).
    day: {
        type: Number,
        required: true,
        min: 1
    },
    // Time of day as text, e.g. "09:00".
    time: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    // Restricted to a fixed set of allowed values.
    type: {
        type: String,
        enum: ['Transport', 'Lodging', 'Food', 'Attraction', 'Other'],
        default: 'Other'
    },
    notes: {
        type: String,
        required: false
    },
    // --- Photo (ticket / confirmation) stored INSIDE MongoDB ---
    // Stored as TWO TOP-LEVEL fields (not a nested object). Top-level Buffer
    // fields persist reliably; a nested "image.data" with select:false did not.
    // imageData = the raw bytes, imageType = the mime type (e.g. "image/jpeg").
    // select: false keeps these heavy fields out of normal queries for speed.
    imageData: {
        type: Buffer,
        select: false
    },
    imageType: {
        type: String,
        select: false
    },
    // Lightweight flag (returned in normal queries) so the frontend knows
    // whether a photo exists without us shipping the bytes every time.
    hasImage: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);