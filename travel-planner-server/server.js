const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config(); 
const cors = require('cors');

const app = express();

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on('error', error => { console.error('Error connecting to MongoDB:', error) });
db.once('open', () => { console.log('Connected to MongoDB successfully!') });

// ייבוא המודל שיצרנו
const User = require('./models/User');
const Trip = require('./models/Trip');

// נתיב להרשמת משתמש חדש
app.post('/api/register', async (req, res) => {
    // מדפיסים לטרמינל כדי לראות מה קיבלנו
    console.log(req.body); 

    // יוצרים משתמש חדש לפי המודל שלנו
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    // מנסים לשמור במסד הנתונים
    try {
        const savedUser = await user.save();
        res.json(savedUser); // מחזירים תשובה שהכל הצליח
    } catch (error) {
        res.status(400).json({ message: error.message }); // מחזירים שגיאה אם משהו השתבש
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});

// נתיב להתחברות משתמש קיים
app.post('/api/login', async (req, res) => {
    try {
        // מחלצים את האימייל והסיסמה מתוך הבקשה
        const { email, password } = req.body;

        // שלב א': מחפשים אם בכלל קיים משתמש עם האימייל הזה במסד הנתונים
        const user = await User.findOne({ email: email });
        
        if (!user) {
            // אם לא מצאנו משתמש
            return res.status(400).json({ message: "User not found" });
        }

        // שלב ב': בודקים אם הסיסמה שהוזנה תואמת לסיסמה השמורה במסד הנתונים
        if (user.password !== password) {
            // אם הסיסמה לא נכונה
            return res.status(400).json({ message: "Wrong password please try again" });
        }

        // אם הגענו לפה, הכל תקין! המשתמש התחבר בהצלחה
        res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// יצירת טיול חדש (POST)
app.post('/api/trips', async (req, res) => {
    try {
        const newTrip = new Trip({
            destination: req.body.destination,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            budget: req.body.budget,
            userId: req.body.userId // תעודת הזהות של המשתמש שיצר את הטיול
        });
        
        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2. שליפת כל הטיולים של משתמש מסוים (GET)
// נשתמש ב- params כדי לקבל את ה-ID מהכתובת
app.get('/api/trips/:userId', async (req, res) => {
    try {
        // מחפשים את כל הטיולים שה-userId שלהם תואם למה שקיבלנו
        const trips = await Trip.find({ userId: req.params.userId });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});