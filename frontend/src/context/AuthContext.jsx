import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, logout as apiLogout } from '../api/auth.js';
import { getTabSession } from '../api/portalSession.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  isLoggedIn: false,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // Only a tab signed in as a citizen has a citizen user; guest and staff tabs never borrow one.
    if (getTabSession()?.role !== 'citizen') {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await getCurrentUser();
      setUser(res.user || null);
      return res.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isLoggedIn: Boolean(user),
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
