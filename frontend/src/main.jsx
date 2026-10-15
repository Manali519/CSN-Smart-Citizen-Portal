import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { initPortalSession } from './api/portalSession.js';
import App from './App.jsx';
import './index.css';

// Settle the tab's session (auto-logout after leaving the portal) before anything asks the API who is signed in.
initPortalSession()
  .catch(() => {})
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  });
