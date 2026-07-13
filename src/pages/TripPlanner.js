import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useFetch } from '../hooks/useFetch';
import ActivityCard from '../components/ActivityCard';
import './TripPlanner.css';

const TripPlanner = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // Custom hook: fetches the trip and gives us data + loading + error in one line.
  // (The trip object is read-only on this page, which is exactly what useFetch is for.
  //  Activities are kept in local state below because we add/edit/delete them.)
  const { data: trip, loading: tripLoading, error: tripError } = useFetch(`/trips/${tripId}`);

  // State
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  const [imageUrls, setImageUrls] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Combined loading state: the page is ready when both requests finish.
  const loading = tripLoading || activitiesLoading;

  // Load the activities list (mutable state — the user adds/edits/deletes items).
  // A 401 (expired token) is handled globally by the interceptor in api.js.
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const res = await api.get(`/trips/${tripId}/activities`);
        setActivities(res.data);
      } catch (err) {
        setError('Could not load this trip.');
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, [tripId]);

  // Load activity images as blob URLs (protected route needs the token)
  useEffect(() => {
    const loadImages = async () => {
      for (const activity of activities) {
        if (activity.hasImage && !imageUrls[activity._id]) {
          try {
            const res = await api.get(
              `/trips/${tripId}/activities/${activity._id}/image`,
              { responseType: 'blob' }
            );
            const url = URL.createObjectURL(res.data);
            setImageUrls((prev) => ({ ...prev, [activity._id]: url }));
          } catch (err) {
            // skip a failed image, don't break the page
          }
        }
      }
    };

    if (activities.length > 0) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, tripId]);

  // useMemo: number of days
  // useMemo caches a calculated value and only recomputes it when its inputs
  // change. Here the day count only depends on the trip's dates, so it won't
  // be recalculated on every keystroke or re-render.
  const numberOfDays = useMemo(() => {
    if (!trip) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }, [trip]);

  const tripDays = useMemo(
    () => Array.from({ length: numberOfDays }, (_, i) => i + 1),
    [numberOfDays]
  );

  // useMemo: activities for the selected day
  // Filtering only needs to redo when the activities list or selected day
  // changes - not when we type in a form. useMemo avoids that wasted work.
  const activitiesForSelectedDay = useMemo(
    () => activities.filter((a) => a.day === selectedDay),
    [activities, selectedDay]
  );

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
      setActivities((prev) => [...prev, response.data]);
      setForm({ time: '', title: '', type: 'Attraction', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add activity.');
    }
  };

  // Handlers passed to the memoized ActivityCard
  // useCallback keeps these functions "stable" between renders, so React.memo
  // can correctly skip re-rendering cards whose data hasn't changed.
  const startEdit = useCallback((activity) => {
    setEditingId(activity._id);
    setEditForm({
      time: activity.time,
      title: activity.title,
      type: activity.type,
      notes: activity.notes || ''
    });
  }, []);

  const handleDeleteActivity = useCallback(async (activityId) => {
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
    } catch (err) {
      setError('Could not delete activity.');
    }
  }, [tripId]);

  const handleImageUpload = useCallback(async (activityId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);

      await api.post(
        `/trips/${tripId}/activities/${activityId}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setActivities((prev) => prev.map((a) => (a._id === activityId ? { ...a, hasImage: true } : a)));
      setImageUrls((prev) => {
        const copy = { ...prev };
        delete copy[activityId];
        return copy;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload image.');
    }
  }, [tripId]);

  const handleDeleteImage = useCallback(async (activityId) => {
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}/image`);
      setActivities((prev) => prev.map((a) => a._id === activityId ? { ...a, hasImage: false } : a));
      setImageUrls((prev) => { const copy = { ...prev }; delete copy[activityId]; return copy; });
    } catch (err) {
      setError('Could not remove photo.');
    }
  }, [tripId]);

  const handleEnlarge = useCallback((url) => {
    setLightboxUrl(url);
  }, []);

  // Save edits (PUT)
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
      setActivities((prev) =>
        prev.map((a) => (a._id === editingId ? { ...response.data, hasImage: a.hasImage } : a))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update activity.');
    }
  };

  // Render
  if (loading) {
    return <div className="planner-container"><p>Loading your itinerary...</p></div>;
  }

  // If the trip itself failed to load (bad id, no access), show the error state.
  if (tripError || !trip) {
    return <div className="planner-container"><p>{tripError || error || 'Could not load this trip.'}</p></div>;
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
              activitiesForSelectedDay.map((activity) =>
                editingId === activity._id ? (
                  // --- EDIT MODE: inline form (kept in the parent) ---
                  <div key={activity._id} className="activity-card">
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
                  </div>
                ) : (
                  // VIEW MODE: memoized card
                  <ActivityCard
                    key={activity._id}
                    activity={activity}
                    imageUrl={imageUrls[activity._id]}
                    onEdit={startEdit}
                    onDelete={handleDeleteActivity}
                    onUpload={handleImageUpload}
                    onDeleteImage={handleDeleteImage}
                    onEnlarge={handleEnlarge}
                  />
                )
              )
            )}
          </div>
        </main>
      </div>

      {/* Lightbox popup */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="enlarged" className="lightbox-image" />
        </div>
      )}
    </div>
  );
};

export default TripPlanner;