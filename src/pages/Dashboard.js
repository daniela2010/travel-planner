import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const trips = []; 

  return (
    <div className="dashboard-container">
      {/* הוספנו את ה-wrapper הזה כדי ליצור את הקופסה הלבנה */}
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
            {/* כאן יופיעו הכרטיסיות בעתיד */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;