const mongoose = require('mongoose');

// Activity model
// An Activity is a single item in a trip's itinerary:
// a flight, a hotel check-in, a restaurant booking, an attraction, etc.
// Each Activity belongs to ONE Trip (and through it, to one User).
// This gives us a nested relationship: User -> Trip -> Activity.
const activitySchema = new mongoose.Schema({
    // Which trip this activity belongs to. This is the link (relationship)
    // between the "activities" collection and the "trips" collection.
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',     // points to the Trip model
        required: true
    },
    // Which day of the trip (1, 2, 3, ...). Lets us group activities by day.
    day: {
        type: Number,
        required: true,
        min: 1
    },
    // Time of day as text, e.g. "09:00". Kept simple as a string.
    time: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    // The kind of activity. "enum" restricts it to a fixed set of allowed values.
    type: {
        type: String,
        enum: ['Transport', 'Lodging', 'Food', 'Attraction', 'Other'],
        default: 'Other'
    },
    // Optional free-text notes (booking reference, address, etc.)
    notes: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);