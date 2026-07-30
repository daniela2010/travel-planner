import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips, deleteTrip, updateTrip, clearError } from '../store/tripsSlice';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Destructure error so we can display it when any trip operation fails
  const { items: trips, loading, error } = useSelector((state) => state.trips);
  const { user, logout } = useAuth();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ destination: '', startDate: '', endDate: '', budget: '' });
  const [editError, setEditError] = useState('');
  const [savingTrip, setSavingTrip] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState(null);

  useEffect(() => {
    // Clear any error left over from a previous page visit before fetching
    dispatch(clearError());
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleDelete = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      setDeletingTripId(tripId);
      try {
        await dispatch(deleteTrip(tripId)).unwrap();
      } catch (err) {
        // Redux stores the rejected request in state.error for the shared banner.
      } finally {
        setDeletingTripId(null);
      }
    }
  };

  const openTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toDateInput = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  };

  const startEdit = (e, trip) => {
    e.stopPropagation();
    setEditError('');
    setEditingId(trip._id);
    setEditForm({
      destination: trip.destination,
      startDate: toDateInput(trip.startDate),
      endDate: toDateInput(trip.endDate),
      budget: trip.budget || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');

    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      setEditError('End date must be after the start date.');
      return;
    }

    // Budget is optional, but if provided it must be a positive number
    if (editForm.budget && (isNaN(editForm.budget) || Number(editForm.budget) <= 0)) {
      setEditError('Budget must be a positive number.');
      return;
    }

    try {
      setSavingTrip(true);
      await dispatch(updateTrip({ id: editingId, tripData: editForm })).unwrap();
      setEditingId(null);
    } catch (err) {
      setEditError(
        typeof err === 'string'
          ? err
          : err.message || 'Could not update the trip. Please check the fields.'
      );
    } finally {
      setSavingTrip(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <h1>{user ? `${user.name}'s Journeys` : 'My Journeys'}</h1>
        <div className="hero-actions">
          <button className="btn-add-trip" onClick={() => navigate('/add-trip')}>+ New Trip</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content-wrapper">
        {/* Global Redux error banner — shown when any trip operation (add/update/delete) fails */}
        {error && (
          <p style={{
            background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '16px'
          }}>
            {error}
          </p>
        )}

        {loading ? (
          <p className="loading-text">Loading your trips...</p>
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
                <div key={trip._id} className="trip-card">
                  <div className="trip-card-accent" />
                  <div className="trip-card-body">
                    <p className="edit-card-title">Editing trip</p>
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

                      {editError && <p className="edit-error">{editError}</p>}

                      <div className="trip-edit-actions">
                        <button type="submit" className="btn-save" disabled={savingTrip}>
                          {savingTrip ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="btn-cancel" disabled={savingTrip} onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div key={trip._id} className="trip-card" onClick={() => openTrip(trip._id)} style={{ cursor: 'pointer' }}>
                  <div className="trip-card-accent" />
                  <div className="trip-card-body">
                    <div className="trip-card-buttons">
                      <button className="btn-edit-trip" disabled={deletingTripId === trip._id} onClick={(e) => startEdit(e, trip)} title="Edit trip">✏️</button>
                      <button className="btn-delete-trip" disabled={deletingTripId === trip._id} onClick={(e) => { e.stopPropagation(); handleDelete(trip._id); }} title="Delete trip">
                        {deletingTripId === trip._id ? '...' : '🗑️'}
                      </button>
                    </div>
                    <h3>{trip.destination}</h3>
                    <div className="trip-dates">
                      <p><strong>From:</strong> {new Date(trip.startDate).toLocaleDateString()}</p>
                      <p><strong>To:</strong> {new Date(trip.endDate).toLocaleDateString()}</p>
                    </div>
                    {trip.budget && <p className="trip-budget">💰 ${trip.budget}</p>}
                    <p className="open-hint">Click to plan your itinerary →</p>
                  </div>
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
