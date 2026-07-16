import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// A wrapper component that protects routes on the CLIENT side.
// If there is no token, the user is redirected to the login page.
// Usage in App.js:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Checking session...</div>;
    }

    // No verified user -> not logged in -> send to login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Session was verified -> show the requested page
    return children;
};

export default ProtectedRoute;
