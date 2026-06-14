import React from 'react';
import { Navigate } from 'react-router-dom';

// A wrapper component that protects routes on the CLIENT side.
// If there is no token, the user is redirected to the login page.
// Usage in App.js:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // No token -> not logged in -> send to login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Token exists -> show the requested page
    return children;
};

export default ProtectedRoute;