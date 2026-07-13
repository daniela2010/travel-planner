import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/variables.css';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading
// React.lazy + Suspense split the code so each page's JavaScript is only
// downloaded WHEN the user navigates to it, instead of all at once on first
// load. This speeds up the initial page load (code-splitting).
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddTripPage = lazy(() => import('./pages/AddTripPage'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Router>
      <div className="App">
        {/* Suspense shows a fallback while a lazy-loaded page is being fetched. */}
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes - only reachable when a token exists */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-trip"
              element={
                <ProtectedRoute>
                  <AddTripPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:tripId"
              element={
                <ProtectedRoute>
                  <TripPlanner />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Catch-all 404 — must be LAST. Renders for any unmatched URL. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;