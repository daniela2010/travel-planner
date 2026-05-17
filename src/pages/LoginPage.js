import React from 'react';
import './LoginPage.css';

const LoginPage = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Travel Planner</h1>
        <p className="subtitle">Please sign in to manage your journeys</p>
        
        <form className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="enter your email" required />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="enter your password" required />
          </div>
          
          <button type="submit" className="btn-login">Sign In</button>
        </form>
        
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;