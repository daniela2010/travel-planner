const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // store all emails in lowercase to avoid duplicates like A@x.com / a@x.com
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // basic rule: a password must be at least 6 characters
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Mongoose pre-save hook ---
// This function runs automatically BEFORE a user document is saved.
// It hashes the password so the plain text is never stored in the database.
userSchema.pre('save', async function (next) {
    // Only hash the password if it was changed (or is new).
    // Without this check, the password would be re-hashed every time we update the user.
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // A "salt" adds randomness so two identical passwords get different hashes.
        // 10 is the cost factor (a good default balance between speed and security).
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // pass the error to Mongoose so the save fails safely
    }
});

// --- Instance method ---
// Lets us compare a plain-text password (from login) with the stored hash.
// Usage: const isMatch = await user.comparePassword(req.body.password);
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);