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

  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper">
        <header className="dashboard-header">
          <h1>My Journeys</h1>
          <button className="btn-add-trip">+ New Trip</button>
        </header>

        {trips.length === 0 ? (
          <div className="empty-state">
             <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📍</div>
            <p>You haven't planned any trips yet.</p>
            <button className="btn-primary-outline">Start your first adventure</button>
          </div>
        ) : (
          <div className="trips-grid">
            {/* כאן אנחנו רצים על הטיולים שחזרו מהשרת ומייצרים כרטיסייה לכל אחד */}
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card">
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