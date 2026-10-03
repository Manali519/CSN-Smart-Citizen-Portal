import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminLoginApi } from '../services/admin/index.js';
import './OfficerLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLoginApi({ email: email.trim(), password });
      navigate('/admin/complaints');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="officer-login-page">
      <div className="officer-card">
        <div className="officer-card-header">
          <div className="officer-badge-icon">🛡️</div>
          <span className="officer-badge-tag">Municipal Corporation</span>
          <h1>Administrator Login</h1>
          <p>Review complaints held by automatic verification.</p>
        </div>

        {error && <div className="officer-alert officer-alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="officer-form">
          <div className="officer-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="officer-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="officer-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="officer-card-footer">
          <p>
            Department officer?{' '}
            <Link to="/officer-login" className="officer-link">Officer Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
