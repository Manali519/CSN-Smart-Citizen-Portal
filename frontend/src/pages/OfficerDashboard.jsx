import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchDepartmentRequests,
  acceptOfficerRequest,
  completeOfficerRequest,
  officerLogoutApi,
} from '../services/officer/index.js';
import './OfficerDashboard.css';

export default function OfficerDashboard() {
  const navigate = useNavigate();

  // Display info only; the server authorises requests with the httpOnly session cookie.
  const [officerSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem('officer_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Strict department isolation: Department is locked to the officer's authenticated department
  const officerDept = officerSession?.department || 'Water Supply and Drainage Department';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Helper to load requests strictly isolated for this department
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDepartmentRequests();
      setRequests(res.requests || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        sessionStorage.removeItem('officer_session');
        navigate('/officer-login');
        return;
      }
      setError(err.message || 'Failed to load department requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /** Accept: optimistic status update, reverted if the server rejects it. */
  const handleAccept = async (request) => {
    const targetId = request._id;
    setActionLoadingId(targetId);

    // Optimistic UI state update
    const previousRequests = [...requests];
    const newStatus = 'Request Accepted.arriving shortly';

    setRequests((prev) =>
      prev.map((r) =>
        r._id === targetId ? { ...r, status: newStatus } : r
      )
    );

    try {
      await acceptOfficerRequest({
        requestId: targetId,
        type: request.type,
      });
    } catch (err) {
      // Revert optimistic update on error
      setRequests(previousRequests);
      setError(`Failed to accept request: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };


  const handleMarkComplete = async (request) => {
    const targetId = request._id;
    setActionLoadingId(targetId);

    const previousRequests = [...requests];
    const newStatus = 'Completed';

    setRequests((prev) =>
      prev.map((r) =>
        r._id === targetId ? { ...r, status: newStatus } : r
      )
    );

    try {
      await completeOfficerRequest({
        requestId: targetId,
        type: request.type,
      });
    } catch (err) {
      setRequests(previousRequests);
      setError(`Failed to mark complete: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await officerLogoutApi();
    } catch {
      // ignore
    }
    sessionStorage.removeItem('officer_session');
    navigate('/officer-login');
  };

  // Filter requests based on status tab
  const filteredRequests = requests.filter((r) => {
    const s = (r.status || '').toLowerCase();
    if (statusFilter === 'all') return true;
    if (statusFilter === 'submitted') {
      return s.includes('submitted') || s === 'pending';
    }
    if (statusFilter === 'accepted') {
      return s.includes('accepted') || s.includes('shortly') || s.includes('progress');
    }
    if (statusFilter === 'completed') {
      return s.includes('completed') || s === 'resolved';
    }
    return true;
  });

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('accepted') || s.includes('shortly')) {
      return <span className="officer-status-badge status-accepted">Request Accepted.arriving shortly</span>;
    }
    if (s.includes('completed') || s === 'resolved') {
      return <span className="officer-status-badge status-completed">Completed</span>;
    }
    return <span className="officer-status-badge status-submitted">Request Submitted</span>;
  };

  // Clean officer ID display (never shows password)
  const displayOfficerId = officerSession?.officerId
    ? String(officerSession.officerId).trim()
    : 'CSMC-OFF-1042';

  return (
    <div className="officer-dashboard-page">
      {/* Top Header Bar - Secure Layout without Password */}
      <header className="officer-topbar">
        <div className="officer-topbar-inner">
          <div className="officer-brand">
            <span className="officer-seal">🛡️</span>
            <div>
              <h1>CSMC Officer Portal</h1>
              <span className="officer-subtext">{officerDept} Queue</span>
            </div>
          </div>

          <div className="officer-user-chip">
            <div className="officer-avatar">👮</div>
            <div className="officer-meta">
              <span className="officer-name">{officerDept}</span>
              <span className="officer-id-tag">Officer ID: {displayOfficerId}</span>
            </div>
            <Link to="/officer/complaints" className="btn-officer-logout">
              Complaints
            </Link>
            <button type="button" className="btn-officer-logout" onClick={handleLogout} title="Sign Out">
              Sign Out
            </button>
          </div>
        </div>
      </header>


      <main className="officer-container">
        {/* Department Banner showing isolated queue */}


        {/* Dashboard Control Toolbar */}
        <div className="dashboard-controls-bar">
          <div className="status-filter-pills">
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Requests ({requests.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'submitted' ? 'active' : ''}`}
              onClick={() => setStatusFilter('submitted')}
            >
              Request Submitted
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'accepted' ? 'active' : ''}`}
              onClick={() => setStatusFilter('accepted')}
            >
              Accepted / Arriving
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </button>
          </div>

          <button
            type="button"
            className="btn-refresh-queue"
            onClick={loadRequests}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Queue'}
          </button>
        </div>

        {error && <div className="officer-alert-error">{error}</div>}

        {/* Officer View Table with User Mobile Number */}
        <section className="officer-queue-section">
          {loading ? (
            <div className="queue-loading-state">
              <div className="spinner"></div>
              <p>Fetching requests routed to {officerDept}...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="queue-empty-state">
              <span className="empty-icon">📂</span>
              <h3>No requests found in this queue</h3>
              <p>All citizen requests for this department have been addressed or none are pending.</p>
            </div>
          ) : (
            <div className="requests-table-container">
              <table className="officer-requests-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>User Name</th>
                    <th>Mobile Number</th>
                    <th>User Address</th>
                    <th>Request Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Workflow Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const s = (req.status || '').toLowerCase();
                    const isSubmitted =
                      !s.includes('accepted') &&
                      !s.includes('shortly') &&
                      !s.includes('completed') &&
                      s !== 'resolved';
                    const isAccepted =
                      (s.includes('accepted') || s.includes('shortly')) &&
                      !s.includes('completed');
                    const isCompleted = s.includes('completed') || s === 'resolved';
                    const isActionLoading = actionLoadingId === req._id;

                    return (
                      <tr key={req._id} className={`request-row ${isCompleted ? 'row-completed' : ''}`}>
                        <td className="col-ref">
                          <strong>{req.referenceNo || 'SR-0000'}</strong>
                          <span className="col-date">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}
                          </span>
                        </td>

                        {/* User Name */}
                        <td className="col-user-name">
                          <span className="user-name-text">{req.userName || 'Citizen'}</span>
                        </td>

                        {/* User Mobile Number */}
                        <td className="col-user-phone">
                          {req.userPhone && req.userPhone !== 'N/A' ? (
                            <a href={`tel:${req.userPhone}`} className="officer-phone-link">
                              📞 {req.userPhone}
                            </a>
                          ) : (
                            <span className="phone-muted">Not Provided</span>
                          )}
                        </td>

                        {/* User Address */}
                        <td className="col-user-address">
                          <address className="user-address-text">
                            {req.userAddress || 'Address on record'}
                          </address>
                        </td>

                        {/* Request Details */}
                        <td className="col-request-details">
                          <div className="request-details-text">
                            {req.requestDetails || 'Standard Service Delivery'}
                          </div>
                          {req.rating && (
                            <div className="citizen-rating-pill">
                              Citizen Rating: ⭐ {req.rating}/5
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="col-status">
                          {getStatusBadge(req.status)}
                        </td>

                        {/* Workflow Actions */}
                        <td className="col-actions">
                          {/* Step 1: Initial Acceptance Action */}
                          {isSubmitted && (
                            <button
                              type="button"
                              className="btn-action btn-accept"
                              onClick={() => handleAccept(req)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? 'Accepting...' : '✓ Accept Request'}
                            </button>
                          )}

                          {/* Step 2: Closure Workflow Action */}
                          {isAccepted && (
                            <button
                              type="button"
                              className="btn-action btn-complete"
                              onClick={() => handleMarkComplete(req)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? 'Updating...' : '🏁 Mark as Complete'}
                            </button>
                          )}

                          {/* Step 3: Completed State */}
                          {isCompleted && (
                            <span className="completed-tag">
                              ✓ Closed &amp; Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
