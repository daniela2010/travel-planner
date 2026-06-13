import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  // החלפנו את המערך הקבוע במשתנה חכם שמתעדכן
  const [trips, setTrips] = useState([]); 
  const navigate = useNavigate();

  // משיכת הטיולים מהשרת ברגע שהדף נטען
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/trips/${userId}`);
        setTrips(response.data);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, [navigate]);

  // מחיקת טיול 
  const handleDelete = async (tripId) => {
    // מקפיצים חלונית אזהרה קטנה למקרה שהמשתמש לחץ בטעות
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        // שולחים בקשה לשרת שלנו, לנתיב המחיקה שיצרנו
        await axios.delete(`http://localhost:5000/api/trips/${tripId}`);
        
        // מעדכנים את המסך מיד: מסננים החוצה את הטיול שנמחק כדי שייעלם בלי לרענן את הדף
        setTrips(trips.filter((trip) => trip._id !== tripId));
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip. Please try again.');
      }
    }
  };

  // --- הפונקציה החדשה: התנתקות ---
  const handleLogout = () => {
    // 1. מוחקים את תעודת הזהות מהזיכרון של הדפדפן
    localStorage.removeItem('userId');
    // 2. מעבירים את המשתמש חזרה לדף ההתחברות
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