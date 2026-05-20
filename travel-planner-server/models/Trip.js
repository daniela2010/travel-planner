const mongoose = require('mongoose');

// הגדרת הסכמה - התבנית של הטיול שלנו
const tripSchema = new mongoose.Schema({
    destination: {
        type: String,
        required: true // חובה להזין יעד
    },
    startDate: {
        type: Date,
        required: true // חובה להזין תאריך התחלה
    },
    endDate: {
        type: Date,
        required: true // חובה להזין תאריך סיום
    },
    budget: {
        type: Number,
        required: false // תקציב - לא חובה
    },
    // השדה הכי חשוב! מי המשתמש שיצר את הטיול הזה?
    userId: {
        type: mongoose.Schema.Types.ObjectId, // זה אומר שאנחנו שומרים פה תעודת זהות של מונגו
        ref: 'User', // מראה שזה קשור למודל המשתמשים שלנו
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ייצוא המודל כדי שנוכל להשתמש בו בשרת
module.exports = mongoose.model('Trip', tripSchema);