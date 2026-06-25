import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips, deleteTrip, updateTrip } from '../store/tripsSlice';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: trips, loading } = useSelector((state) => state.trips);
  const { user, logout } = useAuth();

  // Which trip is being edited (null = none), plus the edit form values.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ destination: '', startDate: '', endDate: '', budget: '' });
  const [editError, setEditError] = useState('');

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleDelete = (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      dispatch(deleteTrip(tripId));
    }
  };

  const openTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Date inputs need the "YYYY-MM-DD" format. Trip dates come as ISO strings,
  // so we slice off just the date part to pre-fill the edit form.
  const toDateInput = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  };

  // Open the edit form for a trip, pre-filled with its current values.
  const startEdit = (e, trip) => {
    e.stopPropagation(); // don't also open the trip
    setEditError('');
    setEditingId(trip._id);
    setEditForm({
      destination: trip.destination,
      startDate: toDateInput(trip.startDate),
      endDate: toDateInput(trip.endDate),
      budget: trip.budget || ''
    });
  };

  // Save the edits via the Redux thunk.
  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');

    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      setEditError('End date must be after the start date.');
      return;
    }

    try {
      // unwrap() lets us catch a rejected thunk here with try/catch.
      await dispatch(updateTrip({ id: editingId, tripData: editForm })).unwrap();
      setEditingId(null);
    } catch (err) {
      setEditError('Could not update the trip. Please check the fields.');
    }
  };

  return (
    <div className="dashboard-container">
      <button className="btn-logout" onClick={handleLogout}>Logout</button>
      <div className="dashboard-content-wrapper">
        <header className="dashboard-header">
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
            {trips.map((trip) =>
              editingId === trip._id ? (
                // --- EDIT MODE: inline form on the card ---
                <div key={trip._id} className="trip-card" style={{ cursor: 'default' }}>
                  <form className="trip-edit-form" onSubmit={handleUpdate}>
                    <label>Destination</label>
                    <input
                      type="text"
                      value={editForm.destination}
                      onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                      required
                    />
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      required
                    />
                    <label>End Date</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      required
                    />
                    <label>Budget ($)</label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    />

                    {editError && <p style={{ color: 'red', fontSize: '0.85rem' }}>{editError}</p>}

                    <div className="trip-edit-actions">
                      <button type="submit" className="btn-add-trip">Save</button>
                      <button type="button" className="btn-primary-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                // --- VIEW MODE ---
                <div key={trip._id} className="trip-card" onClick={() => openTrip(trip._id)} style={{ cursor: 'pointer' }}>
                  <div className="trip-card-buttons">
                    <button
                      className="btn-edit-trip"
                      onClick={(e) => startEdit(e, trip)}
                      title="Edit trip"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete-trip"
                      onClick={(e) => { e.stopPropagation(); handleDelete(trip._id); }}
                      title="Delete trip"
                    >
                      🗑️
                    </button>
                  </div>
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
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;