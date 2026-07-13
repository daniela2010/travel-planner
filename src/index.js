import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';      // Redux provider
import store from './store/store';            // our Redux store
import { AuthProvider } from './context/AuthContext'; // our Context provider
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* ErrorBoundary catches render errors anywhere in the tree —
        shows a friendly recovery screen instead of a white page. */}
    <ErrorBoundary>
      {/* Provider (Redux) makes the store available to the whole app. */}
      <Provider store={store}>
        {/* AuthProvider (Context) makes the user info available to the whole app. */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
