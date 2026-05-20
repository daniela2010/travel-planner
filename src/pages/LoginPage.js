import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css'; // העיצוב המקורי שלך נשאר!

const LoginPage = () => {
  // משתני הזיכרון לשמירת הנתונים שהמשתמש מקליד
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // הפונקציה שמתופעלת בלחיצה על הכפתור
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: email,
        password: password
      });

      // שומרים את ה-ID של המשתמש ב"מחברת" של הדפדפן כדי שה-Dashboard יכיר אותו
      localStorage.setItem('userId', response.data.user.id);

      setMessage('Login successful! Redirecting...');
      
      // מעבירים לדאשבורד
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('An error occurred during login.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Travel Planner</h1>
        <p className="subtitle">Please sign in to manage your journeys</p>
        
        {/* חיבור הפונקציה לטופס */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              placeholder="enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} // עדכון אוטומטי של המשתנה
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} // עדכון אוטומטי של המשתנה
              required 
            />
          </div>
          
          {/* הצגת הודעות למשתמש */}
          {message && (
            <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>              {message}
            </p>
          )}

          <button type="submit" className="btn-login">Sign In</button>
        </form>
        
        <p className="signup-link">
          {/* עדיף להשתמש ב-Link של React כדי למנוע רענון מלא של הדף */}
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;