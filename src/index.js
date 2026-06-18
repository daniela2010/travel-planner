import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';      // Redux provider
import store from './store/store';            // our Redux store
import { AuthProvider } from './context/AuthContext'; // our Context provider
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Provider (Redux) makes the store available to the whole app. */}
    <Provider store={store}>
      {/* AuthProvider (Context) makes the user info available to the whole app. */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();