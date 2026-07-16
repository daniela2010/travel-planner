import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');         // server-level status message
  const [fieldErrors, setFieldErrors] = useState({}); // field-level client validation errors
  const [submitting, setSubmitting] = useState(false); // true while the request is in flight
  const navigate = useNavigate();
  const { login } = useAuth();

  // Client-side validation — mirrors the server-side Joi rules in schemas.js.
  // Running it here gives instant feedback without waiting for an API round-trip.
  const validateForm = () => {
    const errors = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    setSubmitting(true); // disable the button so the form can't be double-submitted
    try {
      const response = await api.post('/register', { name, email, password });
      login(response.data.token, response.data.user);
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Registration failed. Please try again.');
      }
      setSubmitting(false); // re-enable only on failure (success navigates away)
    }
  };

  // Clear a specific field's error as soon as the user edits that field
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="auth-hero">
          <div className="hero-icon">✈️</div>
          <h1>Join Travel Planner</h1>
          <p>Create your account and start exploring</p>
        </div>

        <div className="auth-body">
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
              />
              {fieldErrors.name && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.name}
                </span>
              )}
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              />
              {fieldErrors.email && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              />
              {fieldErrors.password && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
              />
              {fieldErrors.confirmPassword && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.confirmPassword}
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
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
