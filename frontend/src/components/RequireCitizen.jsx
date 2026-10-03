import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Renders its children only for a logged-in citizen; otherwise sends them to login and back here afterwards. */
export default function RequireCitizen({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Checking your session&hellip;</p>
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/citizen-login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}
