import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; // our central axios instance (auto-attaches the token)
import './Dashboard.css';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  // Fetch the trips as soon as the page loads.
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // No userId in the URL anymore: the server reads it from the token.
        const response = await api.get('/trips');
        setTrips(response.data);
      } catch (error) {
        // If the token is missing/expired the server returns 401 -> send to login.
        if (error.response && error.response.status === 401) {
          navigate('/login');
          return;
        }
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, [navigate]);

  // Delete a trip
  const handleDelete = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.delete(`/trips/${tripId}`);
        // Remove the deleted trip from the screen without a page refresh.
        setTrips(trips.filter((trip) => trip._id !== tripId));
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip. Please try again.');
      }
    }
  };

  // Logout: clear the token and go back to login.
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <button className="btn-logout" onClick={handleLogout}>Logout</button>
      <div className="dashboard-content-wrapper">
        <header className="dashboard-header">
          <h1>My Journeys</h1>
          <div className="header-actions">
            <button className="btn-add-trip" onClick={() => navigate('/add-trip')}>+ New Trip</button>
          </div>
        </header>

        {trips.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📍</div>
            <p>You haven't planned any trips yet.</p>
            <button className="btn-primary-outline" onClick={() => navigate('/add-trip')}>Start your first adventure</button>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card">
                <button
                  className="btn-delete-trip"
                  onClick={() => handleDelete(trip._id)}
                  title="Delete trip"
                >
                  🗑️
                </button>
                <h3>{trip.destination}</h3>
                <div className="trip-dates">
                  <p><strong>From:</strong> {new Date(trip.startDate).toLocaleDateString()}</p>
                  <p><strong>To:</strong> {new Date(trip.endDate).toLocaleDateString()}</p>
                </div>
                {trip.budget && <p className="trip-budget"><strong>Budget:</strong> ${trip.budget}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;