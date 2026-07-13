import React from 'react';
import { Link } from 'react-router-dom';

// 404 Not Found page.
// Rendered by the catch-all route (path="*") in App.js for any URL
// that doesn't match a defined route.
const NotFound = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '8px' }}>🧭</div>
      <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
      <h2 style={{ margin: '8px 0' }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Looks like you've wandered off the itinerary. This page doesn't exist.
      </p>
      <Link
        to="/dashboard"
        style={{
          padding: '12px 28px', background: '#4a6cf7', color: 'white',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'
        }}
      >
        Back to My Trips
      </Link>
    </div>
  );
};

export default NotFound;
