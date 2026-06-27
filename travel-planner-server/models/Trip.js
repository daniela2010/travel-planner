const mongoose = require('mongoose');

// Trip schema — defines the shape of a travel trip document in MongoDB.
const tripSchema = new mongoose.Schema({
    destination: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    budget: {
        type: Number,
        required: false // optional field
    },
    // Foreign key — stores the MongoDB ObjectId of the user who created this trip.
    // This is the link between the Users and Trips collections.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // tells Mongoose this ObjectId points to the User model
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Trip', tripSchema);