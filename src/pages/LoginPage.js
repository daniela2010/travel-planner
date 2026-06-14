import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api'; // our central axios instance (auto-attaches the token)
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Note: baseURL is set in api.js, so we only write the path here.
      const response = await api.post('/login', { email, password });

      // Save the JWT token. Every future request will send it automatically.
      localStorage.setItem('token', response.data.token);

      // Optional: keep some user info handy for the UI (e.g. showing the name).
      localStorage.setItem('userName', response.data.user.name);

      setMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
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

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}

          <button type="submit" className="btn-login">Sign In</button>
        </form>

        <p className="signup-link">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;