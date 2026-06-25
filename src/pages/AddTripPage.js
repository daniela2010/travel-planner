import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; // our central axios instance
import './AddTripPage.css';

const AddTripPage = () => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple client-side validation: end date must be after start date.
    if (new Date(endDate) < new Date(startDate)) {
      setMessage('End date must be after the start date.');
      return;
    }

    try {
      // No userId here anymore: the server attaches it from the token.
      await api.post('/trips', { destination, startDate, endDate, budget });

      setMessage('Trip created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Failed to create trip. Please try again.');
      }
    }
  };

  return (
    <div className="add-trip-container">
      <div className="add-trip-card">
        <div className="add-trip-hero">
          <div className="hero-icon">✈️</div>
          <h2>Plan a New Adventure</h2>
          <p>Where are you headed next?</p>
        </div>

        <div className="add-trip-body">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        <form className="add-trip-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Destination</label>
            <input
              type="text"
              placeholder="e.g., Tokyo, Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="input-group half-width">
              <label>Start Date</label>
              <input
                type="date"
                lang="en-GB"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group half-width">
              <label>End Date</label>
              <input
                type="date"
                lang="en-GB"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Estimated Budget ($) - Optional</label>
            <input
              type="number"
              placeholder="e.g., 3000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          {message && (
            <p className={`status-message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}

          <button type="submit" className="btn-submit-trip">Create Trip</button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddTripPage;