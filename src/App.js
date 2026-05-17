import React from 'react';
import './styles/variables.css'; 
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';

function App() {
  return (
    <div className="App">
      <TripPlanner />
    </div>
  );
}

export default App;
