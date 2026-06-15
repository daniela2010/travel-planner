import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api'; // central axios instance (auto-attaches the token)
import './TripPlanner.css';

const TripPlanner = () => {
  // Read the trip id from the URL, e.g. /trip/123  ->  tripId = "123"
  const { tripId } = useParams();
  const navigate = useNavigate();

  // State
  const [trip, setTrip] = useState(null);          // the trip details (destination, dates)
  const [activities, setActivities] = useState([]); // all activities for this trip
  const [selectedDay, setSelectedDay] = useState(1); // which day is currently shown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Controls whether the "add activity" form is open, and holds its values.
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  // --- Load the trip and its activities when the page opens ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // Run both requests, then save the results.
        const tripRes = await api.get(`/trips/${tripId}`);
        const activitiesRes = await api.get(`/trips/${tripId}/activities`);
        setTrip(tripRes.data);
        setActivities(activitiesRes.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/login');
          return;
        }
        setError('Could not load this trip.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId, navigate]);

  // How many days does the trip span? Used to build the day buttons.
  // We calculate it from the start/end dates (at least 1 day).
  const getNumberOfDays = () => {
    if (!trip) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffMs = end - start;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include the last day
    return diffDays > 0 ? diffDays : 1;
  };

  const numberOfDays = getNumberOfDays();

  // Build an array like [1, 2, 3, ...] for the sidebar.
  const tripDays = Array.from({ length: numberOfDays }, (_, i) => i + 1);

  // Only show the activities that belong to the currently selected day.
  const activitiesForSelectedDay = activities.filter((a) => a.day === selectedDay);

  // Add a new activity
  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/trips/${tripId}/activities`, {
        day: selectedDay,        // the activity is added to the day the user is viewing
        time: form.time,
        title: form.title,
        type: form.type,
        notes: form.notes
      });
      // Add the newly created activity to our local list (no full reload needed).
      setActivities([...activities, response.data]);
      // Reset and close the form.
      setForm({ time: '', title: '', type: 'Attraction', notes: '' });
      setShowForm(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not add activity.';
      setError(msg);
    }
  };

  // Delete an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      // Remove it from the local list.
      setActivities(activities.filter((a) => a._id !== activityId));
    } catch (err) {
      setError('Could not delete activity.');
    }
  };

  // Render
  if (loading) {
    return <div className="planner-container"><p>Loading your itinerary...</p></div>;
  }

  if (error && !trip) {
    return <div className="planner-container"><p>{error}</p></div>;
  }

  return (
    <div className="planner-container">
      {/* Top bar with trip details */}
      <header className="planner-header">
        <div className="header-info">
          <h1>{trip.destination}</h1>
          <p>
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
        <button className="btn-primary-outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="planner-layout">
        {/* Sidebar: navigate between days */}
        <aside className="days-sidebar">
          <h3>Itinerary</h3>
          <div className="days-list">
            {tripDays.map((day) => (
              <button
                key={day}
                className={`day-btn ${day === selectedDay ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                Day {day}
              </button>
            ))}
          </div>
        </aside>

        {/* Main area: the selected day's activities */}
        <main className="activities-main">
          <div className="activities-header">
            <h2>Day {selectedDay}</h2>
            <button className="btn-add-activity" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Activity'}
            </button>
          </div>

          {/* Inline form for adding an activity */}
          {showForm && (
            <form className="activity-form" onSubmit={handleAddActivity}>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Activity title (e.g. Visit the Colosseum)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Transport">Transport</option>
                <option value="Lodging">Lodging</option>
                <option value="Food">Food</option>
                <option value="Attraction">Attraction</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <button type="submit" className="btn-add-activity">Save</button>
            </form>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="activities-list">
            {activitiesForSelectedDay.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No activities planned for this day yet.</p>
            ) : (
              activitiesForSelectedDay.map((activity) => (
                <div key={activity._id} className="activity-card">
                  <div className="activity-time">{activity.time}</div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <span className="badge">{activity.type}</span>
                    {activity.notes && <p className="activity-notes">{activity.notes}</p>}
                  </div>
                  <button
                    className="btn-icon"
                    title="Delete activity"
                    onClick={() => handleDeleteActivity(activity._id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TripPlanner;