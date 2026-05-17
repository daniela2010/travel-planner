import React from 'react';
import './TripCard.css';

const TripCard = ({ title, dates, location }) => {
  return (
    <div className="trip-card">
      <div className="trip-card-image">
        {/* כאן תבוא תמונה דינמית בהמשך */}
        <div className="image-placeholder">{location[0]}</div>
      </div>
      <div className="trip-card-content">
        <h3>{title}</h3>
        <p className="trip-dates">{dates}</p>
        <div className="trip-card-actions">
          <button className="btn-view">View Plan</button>
          <button className="btn-delete-icon" title="Delete Trip">🗑️</button>
        </div>
      </div>
    </div>
  );
};

export default TripCard;