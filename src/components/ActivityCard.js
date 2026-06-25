import React from 'react';

// ActivityCard (memoized)
// React.memo wraps a component so it only RE-RENDERS when its own props
// actually change. Without it, every activity card re-renders whenever the
// parent re-renders (e.g. on every keystroke in a form). With many cards,
// that is wasted work. memo skips re-rendering a card whose data is unchanged.

// This card is "view mode" only. The edit form stays in the parent, which
// keeps this component simple and easy for memo to compare.
const ActivityCard = ({ activity, imageUrl, onEdit, onDelete, onUpload, onEnlarge }) => {
  return (
    <div className="activity-card" data-type={activity.type}>
      <div className="activity-time">{activity.time}</div>

      <div className="activity-details">
        <h4>{activity.title}</h4>
        <span className="badge" data-type={activity.type}>{activity.type}</span>
        {activity.notes && <p className="activity-notes">{activity.notes}</p>}

        {/* Show the photo if it has been loaded. Click to enlarge. */}
        {activity.hasImage && imageUrl && (
          <img
            src={imageUrl}
            alt="ticket or confirmation"
            className="activity-image"
            onClick={() => onEnlarge(imageUrl)}
          />
        )}

        {/* Upload / change photo */}
        <label className="upload-label">
          {activity.hasImage ? '🖼️ Change photo' : '📎 Attach photo'}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onUpload(activity._id, e.target.files[0])}
          />
        </label>
      </div>

      <div className="activity-actions">
        <button className="btn-icon" title="Edit" onClick={() => onEdit(activity)}>✏️</button>
        <button className="btn-icon" title="Delete" onClick={() => onDelete(activity._id)}>🗑️</button>
      </div>
    </div>
  );
};

// Export wrapped in React.memo
export default React.memo(ActivityCard);