import React from 'react';
import { Navigate } from 'react-router-dom';
import { getTabSession, LOGIN_PATHS } from '../api/portalSession.js';

/**
 * Renders its children only in a tab signed in as `role` (officer or admin). A citizen or guest tab is sent
 * to that role's login page instead of seeing the staff dashboard; the API enforces the same rule.
 */
export default function RequireStaff({ role, children }) {
  if (getTabSession()?.role !== role) return <Navigate to={LOGIN_PATHS[role]} replace />;
  return children;
}
