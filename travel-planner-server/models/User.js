const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        minlength: 6, // basic rule: a password must be at least 6 characters
        select: false // excluded from all queries by default so the hash can never
                      // leak in an API response. Login opts back in with .select('+password').
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mongoose pre-save hook
// Runs automatically BEFORE a user document is saved.
// It hashes the password so the plain text is never stored in the database.
// Note: with an async hook we do NOT use a "next" callback. We simply await,
// and Mongoose continues when the function finishes (or aborts if it throws).
userSchema.pre('save', async function () {
    // Only hash the password if it was changed (or is new),
    // otherwise it would get re-hashed on every update.
    if (!this.isModified('password')) {
        return;
    }

    // A "salt" adds randomness so two identical passwords get different hashes.
    // 10 is the cost factor (a good default balance between speed and security).
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method
// Lets us compare a plain-text password (from login) with the stored hash.
// Usage: const isMatch = await user.comparePassword(req.body.password);
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);