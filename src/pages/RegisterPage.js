import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // הוספנו את useNavigate כדי שנוכל להעביר דף אחרי ההרשמה
import axios from 'axios'; // ייבוא השליח שלנו!
import '../styles/Auth.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // משתנים להצגת הודעות הצלחה או שגיאה
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); // עוצר את רענון הדף הרגיל

    try {
      // כאן אנחנו שולחים את המידע לשרת שלנו!
      const response = await axios.post('http://localhost:5000/api/register', {
        name: name,
        email: email,
        password: password
      });

      // אם הגענו לפה, ההרשמה הצליחה
      setMessage('Registration successful! Redirecting to login...');
      
      // מחכים 2 שניות ומעבירים את המשתמש לדף ההתחברות
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // אם יש שגיאה (למשל האימייל כבר קיים), נציג אותה
      setMessage('Registration failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            placeholder="Enter your full name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="Create a password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        
        {/* הודעת סטטוס קטנה למשתמש */}
        {message && <p className="status-message" style={{ color: message.includes('failed') ? 'red' : 'green' }}>{message}</p>}

        <button type="submit" className="auth-button">Register</button>
      </form>
      <p className="signup-link">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}

export default RegisterPage;