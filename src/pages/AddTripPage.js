import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addTrip } from '../store/tripsSlice';
import './AddTripPage.css';

const AddTripPage = () => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [budget, setBudget]           = useState('');
  const [message, setMessage]         = useState('');       // server-level status message
  const [fieldErrors, setFieldErrors] = useState({});       // field-level client validation errors
  const [submitting, setSubmitting]   = useState(false);    // true while the request is in flight
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Client-side validation before dispatching to Redux / calling the API.
  const validateForm = () => {
    const errors = {};

    if (!destination.trim() || destination.trim().length < 2) {
      errors.destination = 'Destination must be at least 2 characters';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = 'End date must be after the start date';
    }

    if (budget && (isNaN(budget) || Number(budget) <= 0)) {
      errors.budget = 'Budget must be a positive number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    setSubmitting(true); // disable the button so the form can't be double-submitted
    try {
      // Dispatch through Redux so the new trip lands in the store immediately.
      // The server reads the userId from the JWT token — we do not send it here.
      // .unwrap() re-throws the error if the thunk is rejected, so the catch block runs.
      await dispatch(addTrip({ destination, startDate, endDate, budget: budget || undefined })).unwrap();

      setMessage('Trip created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      setMessage(
        typeof error === 'string'
          ? error
          : error.message || 'Failed to create trip. Please try again.'
      );
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
                onChange={(e) => { setDestination(e.target.value); clearFieldError('destination'); }}
              />
              {fieldErrors.destination && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.destination}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="input-group half-width">
                <label>Start Date</label>
                <input
                  type="date"
                  lang="en-GB"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); clearFieldError('startDate'); }}
                />
                {fieldErrors.startDate && (
                  <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.startDate}
                  </span>
                )}
              </div>
              <div className="input-group half-width">
                <label>End Date</label>
                <input
                  type="date"
                  lang="en-GB"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); clearFieldError('endDate'); }}
                />
                {fieldErrors.endDate && (
                  <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.endDate}
                  </span>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>Estimated Budget ($) — Optional</label>
              <input
                type="number"
                placeholder="e.g., 3000"
                value={budget}
                onChange={(e) => { setBudget(e.target.value); clearFieldError('budget'); }}
              />
              {fieldErrors.budget && (
                <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.budget}
                </span>
              )}
            </div>

            {/* Server-level message (success or API error) */}
            {message && (
              <p className={`status-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <button type="submit" className="btn-submit-trip" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Trip'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTripPage;
