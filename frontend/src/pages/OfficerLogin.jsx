import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OfficerLogin.css';

export default function OfficerLogin() {
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('administration');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!officerId.trim()) {
      setError('Please enter your Officer ID / Username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    // Simulated officer authentication
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 700);
  };

  return (
    <div className="officer-login-page">
      <div className="officer-card">
        <div className="officer-card-header">
          <div className="officer-badge-icon">🛡️</div>
          <span className="officer-badge-tag">Municipal Corporation</span>
          <h1>Officer Portal Login</h1>
          <p>Authorized access for designated CSMC administrative and field officers.</p>
        </div>

        {error && <div className="officer-alert officer-alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="officer-form" noValidate>
          <div className="officer-field">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="administration">General Administration &amp; Grievances</option>
              <option value="water">Water Supply &amp; Drainage</option>
              <option value="roads">Roads, Bridges &amp; Infrastructure</option>
              <option value="sanitation">Solid Waste &amp; Public Sanitation</option>
              <option value="electrical">Electrical &amp; Street Lighting</option>
              <option value="health">Public Health &amp; Hospitals</option>
            </select>
          </div>

          <div className="officer-field">
            <label htmlFor="officerId">Officer ID / Username</label>
            <input
              id="officerId"
              type="text"
              placeholder="e.g. CSMC-OFF-1042"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
            />
          </div>

          <div className="officer-field">
            <label htmlFor="password">Security Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="officer-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Officer'}
          </button>
        </form>

        <div className="officer-card-footer">
          <p>
            Are you a citizen?{' '}
            <Link to="/citizen-login" className="officer-link">
              Citizen Login here
            </Link>
          </p>
          <p className="officer-help-text">
            IT Helpdesk: <strong>helpdesk@csmc.gov.in</strong> | Ext. 204
          </p>
        </div>
      </div>
    </div>
  );
}
