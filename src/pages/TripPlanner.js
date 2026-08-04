import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useFetch } from '../hooks/useFetch';
import ActivityCard from '../components/ActivityCard';
import './TripPlanner.css';

// Trip Planner page. Shows one trip's day-by-day itinerary. Loads the trip
// (via the useFetch hook) and its activities, and lets the user add, edit,
// delete, and attach or remove photos on activities for each day.
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
  const [activitiesLoadError, setActivitiesLoadError] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', title: '', type: 'Attraction', notes: '' });

  const [imageUrls, setImageUrls] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [addingActivity, setAddingActivity] = useState(false);
  const [updatingActivity, setUpdatingActivity] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [uploadingActivityId, setUploadingActivityId] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const imageUrlsRef = useRef({});

  // Combined loading state: the page is ready when both requests finish.
  const loading = tripLoading || activitiesLoading;

  // Load the activities list (mutable state — the user adds/edits/deletes items).
  // A 401 (expired token) is handled globally by the interceptor in api.js.
  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesLoadError('');
    try {
      const res = await api.get(`/trips/${tripId}/activities`);
      setActivities(res.data);
    } catch (err) {
      setActivitiesLoadError(err.response?.data?.message || 'Could not load this trip.');
    } finally {
      setActivitiesLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    // Keep the latest URL map available to the unmount cleanup without rerunning it.
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  useEffect(() => {
    // Object URLs hold browser memory and must be released when the page closes.
    return () => {
      Object.values(imageUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Revoke and remove one cached preview before replacing or deleting its image.
  const discardImageUrl = useCallback((activityId) => {
    setImageUrls((prev) => {
      if (prev[activityId]) URL.revokeObjectURL(prev[activityId]);
      const copy = { ...prev };
      delete copy[activityId];
      return copy;
    });
  }, []);

  // Load activity images as blob URLs (protected route needs the token)
  useEffect(() => {
    const loadImages = async () => {
      for (const activity of activities) {
        if (activity.hasImage && !imageUrlsRef.current[activity._id]) {
          try {
            const res = await api.get(
              `/trips/${tripId}/activities/${activity._id}/image`,
              { responseType: 'blob' }
            );
            // Convert the protected binary response into a temporary <img>-safe URL.
            const url = URL.createObjectURL(res.data);
            setImageUrls((prev) => {
              if (prev[activity._id]) {
                URL.revokeObjectURL(url);
                return prev;
              }
              return { ...prev, [activity._id]: url };
            });
          } catch (err) {
            // skip a failed image, don't break the page
          }
        }
      }
    };

    if (activities.length > 0) {
      loadImages();
    }
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

  const validateActivity = (values) => {
    if (!values.time) return 'Time is required.';
    if (!values.title.trim() || values.title.trim().length < 2) {
      return 'Activity title must be at least 2 characters.';
    }
    return '';
  };

  // Add a new activity
  const handleAddActivity = async (e) => {
    e.preventDefault();
    const validationError = validateActivity(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setAddingActivity(true);
    setError('');
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
    } finally {
      setAddingActivity(false);
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
    if (!window.confirm('Delete this activity?')) return;

    setDeletingActivityId(activityId);
    setError('');
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
      discardImageUrl(activityId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete activity.');
    } finally {
      setDeletingActivityId(null);
    }
  }, [discardImageUrl, tripId]);

  const handleImageUpload = useCallback(async (activityId, file) => {
    if (!file) return;
    // Client checks provide immediate feedback; Multer repeats them for security.
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large (max 5 MB).');
      return;
    }

    setUploadingActivityId(activityId);
    setError('');
    try {
      // FormData is required because JSON cannot carry the file's binary bytes.
      const formData = new FormData();
      formData.append('image', file);

      await api.post(
        `/trips/${tripId}/activities/${activityId}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setActivities((prev) => prev.map((a) => (a._id === activityId ? { ...a, hasImage: true } : a)));
      discardImageUrl(activityId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload image.');
    } finally {
      setUploadingActivityId(null);
    }
  }, [discardImageUrl, tripId]);

  const handleDeleteImage = useCallback(async (activityId) => {
    setDeletingImageId(activityId);
    setError('');
    try {
      await api.delete(`/trips/${tripId}/activities/${activityId}/image`);
      setActivities((prev) => prev.map((a) => a._id === activityId ? { ...a, hasImage: false } : a));
      discardImageUrl(activityId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove photo.');
    } finally {
      setDeletingImageId(null);
    }
  }, [discardImageUrl, tripId]);

  const handleEnlarge = useCallback((url) => {
    setLightboxUrl(url);
  }, []);

  // Save edits (PUT)
  const handleUpdateActivity = async (e) => {
    e.preventDefault();
    const validationError = validateActivity(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUpdatingActivity(true);
    setError('');
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
    } finally {
      setUpdatingActivity(false);
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

  if (activitiesLoadError) {
    return (
      <div className="planner-container planner-state">
        <p>{activitiesLoadError}</p>
        <button className="btn-primary-outline" onClick={loadActivities}>Try Again</button>
      </div>
    );
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
              <button type="submit" className="btn-add-activity" disabled={addingActivity}>
                {addingActivity ? 'Saving...' : 'Save'}
              </button>
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
                      <button type="submit" className="btn-add-activity" disabled={updatingActivity}>
                        {updatingActivity ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="btn-primary-outline" disabled={updatingActivity} onClick={() => setEditingId(null)}>Cancel</button>
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
                    isDeleting={deletingActivityId === activity._id}
                    isUploading={uploadingActivityId === activity._id}
                    isDeletingImage={deletingImageId === activity._id}
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
