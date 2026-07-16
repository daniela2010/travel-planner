import React from 'react';

// ActivityCard (memoized)
// React.memo wraps a component so it only RE-RENDERS when its own props
// actually change. Without it, every activity card re-renders whenever the
// parent re-renders (e.g. on every keystroke in a form). With many cards,
// that is wasted work. memo skips re-rendering a card whose data is unchanged.

// This card is "view mode" only. The edit form stays in the parent, which
// keeps this component simple and easy for memo to compare.
const ActivityCard = ({
  activity,
  imageUrl,
  onEdit,
  onDelete,
  onUpload,
  onDeleteImage,
  onEnlarge,
  isDeleting,
  isUploading,
  isDeletingImage
}) => {
  const isBusy = isDeleting || isUploading || isDeletingImage;

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
        <label className={`upload-label ${isUploading ? 'disabled' : ''}`}>
          {isUploading ? 'Uploading...' : activity.hasImage ? '🖼️ Change photo' : '📎 Attach photo'}
          <input
            type="file"
            accept="image/*"
            disabled={isBusy}
            style={{ display: 'none' }}
            onChange={(e) => onUpload(activity._id, e.target.files[0])}
          />
        </label>

        {/* Delete photo button — only shown when a photo exists */}
        {activity.hasImage && (
          <button
            style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', marginTop: '4px', padding: 0, fontSize: '0.85rem' }}
            type="button"
            disabled={isBusy}
            onClick={() => onDeleteImage(activity._id)}
          >
            {isDeletingImage ? 'Removing...' : '🗑️ Remove photo'}
          </button>
        )}
      </div>

      <div className="activity-actions">
        <button type="button" className="btn-icon" title="Edit" disabled={isBusy} onClick={() => onEdit(activity)}>✏️</button>
        <button type="button" className="btn-icon" title="Delete" disabled={isBusy} onClick={() => onDelete(activity._id)}>
          {isDeleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
};

// Export wrapped in React.memo
export default React.memo(ActivityCard);
