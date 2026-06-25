import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
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
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {message && (
              <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <button type="submit" className="btn-auth">Create Account</button>
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
