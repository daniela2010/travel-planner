import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './TripPlanner.css';

const TripPlanner = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // State
  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // "Add" form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  // "Edit" form: holds the id of the activity being edited (null = not editing)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  // Holds blob URLs for activity images we've loaded, keyed by activity id.
  const [imageUrls, setImageUrls] = useState({});

  // Holds the image URL currently shown enlarged in the popup (null = closed).
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Load the trip and its activities
  useEffect(() => {
    const loadData = async () => {
      try {
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

  // Load an activity's image as a blob URL
  // The image route is protected (needs the token), so a plain <img src> won't
  // work. We fetch it via axios (token attached automatically), get binary
  // data, and create a temporary in-browser URL for the <img> to display.
  useEffect(() => {
    const loadImages = async () => {
      for (const activity of activities) {
        if (activity.hasImage && !imageUrls[activity._id]) {
          try {
            const res = await api.get(
              `/trips/${tripId}/activities/${activity._id}/image`,
              { responseType: 'blob' } // tell axios to expect binary data
            );
            const url = URL.createObjectURL(res.data);
            setImageUrls((prev) => ({ ...prev, [activity._id]: url }));
          } catch (err) {
            // If one image fails, just skip it - don't break the page.
          }
        }
      }
    };

    if (activities.length > 0) {
      loadImages();
    }
    // We intentionally depend on "activities" so newly added ones get loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, tripId]);

  const getNumberOfDays = () => {
    if (!trip) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const numberOfDays = getNumberOfDays();
  const tripDays = Array.from({ length: numberOfDays }, (_, i) => i + 1);
  const activitiesForSelectedDay = activities.filter((a) => a.day === selectedDay);

  // Add a new activity
  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/trips/${tripId}/activities`, {
        day: selectedDay,
        time: form.time,
        title: form.title,
        type: form.type,
        notes: form.notes
      });
      setActivities([...activities, response.data]);
      setForm({ time: '', title: '', type: 'Attraction', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add activity.');
    }
  };

  // Start editing: open the edit form pre-filled with current values
  const startEdit = (activity) => {
    setEditingId(activity._id);
    setEditForm({
      time: activity.time,
      title: activity.title,
      type: activity.type,
      notes: activity.notes || ''
    });
  };

  // Save edits (PUT request)
  const handleUpdateActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `/trips/${tripId}/activities/${editingId}`,
        {
          day: selectedDay,
          time: editForm.time,
          title: editForm.title,
          type: editForm.type,
          notes: editForm.notes
        }
      );
      // Replace the edited activity in our local list with the updated one.
      setActivities(activities.map((a) => (a._id === editingId ? { ...response.data, hasImage: a.hasImage } : a)));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update activity.');
    }
  };

  // Delete an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      setActivities(activities.filter((a) => a._id !== activityId));
    } catch (err) {
      setError('Could not delete activity.');
    }
  };

  // Upload a photo for an activity
  const handleImageUpload = async (activityId, file) => {
    if (!file) return;
    try {
      // FormData is the format required for file uploads (multipart/form-data).
      const formData = new FormData();
      formData.append('image', file); // field name must match upload.single('image')

      await api.post(
        `/trips/${tripId}/activities/${activityId}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Mark this activity as having an image, and clear any old cached URL
      // so the effect re-fetches and shows the new photo.
      setActivities(activities.map((a) => (a._id === activityId ? { ...a, hasImage: true } : a)));
      setImageUrls((prev) => {
        const copy = { ...prev };
        delete copy[activityId];
        return copy;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload image.');
    }
  };

  // --- Render ---
  if (loading) {
    return <div className="planner-container"><p>Loading your itinerary...</p></div>;
  }

  if (error && !trip) {
    return <div className="planner-container"><p>{error}</p></div>;
  }

  return (
    <div className="planner-container">
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
        <aside className="days-sidebar">
          <h3>Itinerary</h3>
          <div className="days-list">
            {tripDays.map((day) => (
              <button
                key={day}
                className={`day-btn ${day === selectedDay ? 'active' : ''}`}
                onClick={() => { setSelectedDay(day); setEditingId(null); }}
              >
                Day {day}
              </button>
            ))}
          </div>
        </aside>

        <main className="activities-main">
          <div className="activities-header">
            <h2>Day {selectedDay}</h2>
            <button className="btn-add-activity" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Activity'}
            </button>
          </div>

          {showForm && (
            <form className="activity-form" onSubmit={handleAddActivity}>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              <input type="text" placeholder="Activity title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Transport">Transport</option>
                <option value="Lodging">Lodging</option>
                <option value="Food">Food</option>
                <option value="Attraction">Attraction</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                  {editingId === activity._id ? (
                    // --- EDIT MODE: inline form replaces the card content ---
                    <form className="activity-form" style={{ width: '100%' }} onSubmit={handleUpdateActivity}>
                      <input type="time" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} required />
                      <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                      <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                        <option value="Transport">Transport</option>
                        <option value="Lodging">Lodging</option>
                        <option value="Food">Food</option>
                        <option value="Attraction">Attraction</option>
                        <option value="Other">Other</option>
                      </select>
                      <input type="text" placeholder="Notes (optional)" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                      <button type="submit" className="btn-add-activity">Save</button>
                      <button type="button" className="btn-primary-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </form>
                  ) : (
                    // VIEW MODE: normal card
                    <>
                      <div className="activity-time">{activity.time}</div>
                      <div className="activity-details">
                        <h4>{activity.title}</h4>
                        <span className="badge">{activity.type}</span>
                        {activity.notes && <p className="activity-notes">{activity.notes}</p>}

                        {/* Show the photo if we've loaded it. Click to enlarge. */}
                        {activity.hasImage && imageUrls[activity._id] && (
                          <img
                            src={imageUrls[activity._id]}
                            alt="ticket or confirmation"
                            className="activity-image"
                            onClick={() => setLightboxUrl(imageUrls[activity._id])}
                          />
                        )}

                        {/* Upload control */}
                        <label className="upload-label">
                          {activity.hasImage ? '🖼️ Change photo' : '📎 Attach photo'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageUpload(activity._id, e.target.files[0])}
                          />
                        </label>
                      </div>
                      <div className="activity-actions">
                        <button className="btn-icon" title="Edit" onClick={() => startEdit(activity)}>✏️</button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDeleteActivity(activity._id)}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Lightbox popup: shows the clicked photo full size. */}
      {/* Clicking anywhere on the dark overlay closes it. */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="enlarged" className="lightbox-image" />
        </div>
      )}
    </div>
  );
};

export default TripPlanner;