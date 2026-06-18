import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Redux hooks
import { fetchTrips, deleteTrip } from '../store/tripsSlice';
import { useAuth } from '../context/AuthContext'; // Context hook
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Read trips from the Redux store instead of local component state.
  // useSelector picks the piece of the store we care about.
  const { items: trips, loading } = useSelector((state) => state.trips);

  // Read the logged-in user + logout function from Context.
  const { user, logout } = useAuth();

  // On load, ask Redux to fetch the trips (dispatch runs the thunk).
  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleDelete = (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      // Dispatch the delete thunk; the store updates the list automatically.
      dispatch(deleteTrip(tripId));
    }
  };

  const openTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  const handleLogout = () => {
    logout();              // clears token + user via Context
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <button className="btn-logout" onClick={handleLogout}>Logout</button>
      <div className="dashboard-content-wrapper">
        <header className="dashboard-header">
          {/* Greet the user by name, taken from Context */}
          <h1>{user ? `${user.name}'s Journeys` : 'My Journeys'}</h1>
          <div className="header-actions">
            <button className="btn-add-trip" onClick={() => navigate('/add-trip')}>+ New Trip</button>
          </div>
        </header>

        {loading ? (
          <p>Loading your trips...</p>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📍</div>
            <p>You haven't planned any trips yet.</p>
            <button className="btn-primary-outline" onClick={() => navigate('/add-trip')}>Start your first adventure</button>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card" onClick={() => openTrip(trip._id)} style={{ cursor: 'pointer' }}>
                <button
                  className="btn-delete-trip"
                  onClick={(e) => { e.stopPropagation(); handleDelete(trip._id); }}
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
                <p className="open-hint" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                  Click to plan your itinerary →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;