import React from 'react';
import './TripPlanner.css';

const TripPlanner = () => {
  // נתוני דמה כדי לראות את העיצוב בפעולה
  const tripDays = [
    { id: 1, label: 'Day 1: Arrival & Rome Center' },
    { id: 2, label: 'Day 2: Ancient History' },
    { id: 3, label: 'Day 3: Day Trip to Naples' }
  ];

  const activities = [
    { id: 1, time: '09:00', title: 'Flight landing at FCO', type: 'Transport' },
    { id: 2, time: '11:30', title: 'Check-in to Grand Hotel Europa', type: 'Lodging' },
    { id: 3, time: '14:00', title: 'Lunch near the Colosseum', type: 'Food' }
  ];

  return (
    <div className="planner-container">
      {/* סרגל עליון עם פרטי הטיול */}
      <header className="planner-header">
        <div className="header-info">
          <h1>Rome Getaway</h1>
          <p>October 2024</p>
        </div>
        <button className="btn-primary-outline">Share Itinerary</button>
      </header>

      <div className="planner-layout">
        {/* סרגל צד - ניווט בין ימים */}
        <aside className="days-sidebar">
          <h3>Itinerary</h3>
          <div className="days-list">
            {tripDays.map((day, index) => (
              <button key={day.id} className={`day-btn ${index === 0 ? 'active' : ''}`}>
                {day.label}
              </button>
            ))}
          </div>
          <button className="btn-add-day">+ Add Day</button>
        </aside>

        {/* אזור מרכזי - רשימת הפעילויות */}
        <main className="activities-main">
          <div className="activities-header">
            <h2>Day 1: Arrival & Rome Center</h2>
            <button className="btn-add-activity">+ Add Activity</button>
          </div>

          <div className="activities-list">
            {activities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-time">{activity.time}</div>
                <div className="activity-details">
                  <h4>{activity.title}</h4>
                  <span className="badge">{activity.type}</span>
                </div>
                <button className="btn-icon" title="Options">⋮</button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TripPlanner;