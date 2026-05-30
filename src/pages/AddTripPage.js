import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    
    try {
      // מושכים את ה-ID של המשתמש מהמחברת כדי לדעת למי לשייך את הטיול
      const userId = localStorage.getItem('userId');
      
      await axios.post('http://localhost:5000/api/trips', {
        destination,
        startDate,
        endDate,
        budget,
        userId
      });

      setMessage('Trip created successfully! Redirecting...');
      
      // מחכים שנייה וחוזרים לדאשבורד, שם הטיול כבר יחכה לנו
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      setMessage('Failed to create trip. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="add-trip-container">
      <div className="add-trip-card">
        <header className="add-trip-header">
          <h2>Plan a New Adventure</h2>
          {/* כפתור חזרה מהיר למקרה שהמשתמש התחרט */}
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </header>

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
                lang="en-GB" /* הכרחת השפה לאנגלית בפורמט יום/חודש/שנה */
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required 
              />
            </div>
            <div className="input-group half-width">
              <label>End Date</label>
              <input 
                type="date" 
                lang="en-GB" /* הכרחת השפה לאנגלית בפורמט יום/חודש/שנה */
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
  );
};

export default AddTripPage;