import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

// Login page. Collects email and password, validates them on the client,
// then calls POST /login. On success it stores the JWT through AuthContext
// and redirects the user to the dashboard.
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');       // server-level status message
  const [fieldErrors, setFieldErrors] = useState({}); // field-level client validation errors
  const [submitting, setSubmitting] = useState(false); // true while the login request is in flight
  const navigate = useNavigate();
  const { login } = useAuth();

  // Client-side validation before the API call.
  // Returns true if all fields are valid; populates fieldErrors otherwise.
  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    // Stop here if client-side validation fails — no API call needed
    if (!validateForm()) return;

    setSubmitting(true); // disable the button so the form can't be double-submitted
    try {
      const response = await api.post('/login', { email, password });
      login(response.data.token, response.data.user);
      setMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('An error occurred during login.');
      }
      setSubmitting(false); // re-enable only on failure (success navigates away)
    }
  };

  // Clear the field error for a given field as soon as the user starts typing
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="auth-hero">
          <div className="hero-icon">✈️</div>
          <h1>Travel Planner</h1>
          <p>Sign in to manage your journeys</p>
        </div>

        <div className="auth-body">
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              />
              {/* Inline field error shown directly below the input */}
              {fieldErrors.email && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              />
              {fieldErrors.password && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Server-level message (success or API error) */}
            {message && (
              <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <button type="submit" className="btn-auth" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
