import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api'; // our central axios instance
import '../styles/Auth.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/register', { name, email, password });

      // The server now returns a token on register too, so we log the user in directly.
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.user.name);

      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      // Show the real server message when available (e.g. "email already registered").
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Registration failed. Please try again.');
      }
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
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {message && (
          <p className="status-message" style={{ color: message.includes('successful') ? 'green' : 'red' }}>
            {message}
          </p>
        )}

        <button type="submit" className="auth-button">Register</button>
      </form>
      <p className="signup-link">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}

export default RegisterPage;