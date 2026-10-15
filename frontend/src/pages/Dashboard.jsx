import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, completeProfile } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMyComplaints, submitComplaintFeedback } from '../services/complaints/index.js';
import { fetchMyRequests } from '../api/requests.js';
import { fetchMyTankerBookings, fetchMyGarbageBookings } from '../services/bookings/index.js';
import { submitServiceRating } from '../services/officer/index.js';
import { assetUrl } from '../api/client.js';
import ServiceRating from '../components/ServiceRating.jsx';
import './Dashboard.css';

const COMPLAINT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'solved', label: 'Solved' },
];

const SOLVED_STATUSES = ['Resolved', 'Closed'];

// Citizens see "Under Verification" rather than the internal "Suspected Fake" label.
const COMPLAINT_STATUS_UI = {
  'Pending Review': { label: 'Pending Review', className: 'status-pending' },
  'Suspected Fake': { label: 'Under Verification', className: 'status-pending' },
  Rejected: { label: 'Rejected', className: 'status-cancelled' },
  'In Progress': { label: 'In Progress', className: 'status-in-progress' },
  Resolved: { label: 'Resolved', className: 'status-resolved' },
  Closed: { label: 'Closed', className: 'status-resolved' },
  Reopened: { label: 'Reopened', className: 'status-in-progress' },
};


const EMPTY_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  contactNo: '',
  streetAddress: '',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [isProfileOpen, setIsProfileOpen] = useState(true);

  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [feedbackError, setFeedbackError] = useState('');
  // Per-complaint draft rating/comment until the citizen submits and closes it.
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [feedbackBusyId, setFeedbackBusyId] = useState(null);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((res) => {
        if (cancelled) return;
        const currentUser = res.user || {};
        setUser(currentUser);
        setProfileForm({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          dob: currentUser.dob || '',
          contactNo: currentUser.contactNo || '',
          streetAddress: currentUser.streetAddress || '',
        });
        const profileIncomplete = !currentUser.firstName || !currentUser.lastName || !currentUser.dob || !currentUser.contactNo || !currentUser.streetAddress;
        setIsProfileOpen(profileIncomplete);
        if (profileIncomplete) {
          setActiveNav('profile');
        }
      })
      .catch(() => {
        if (!cancelled) navigate('/citizen-login');
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => { cancelled = true; };
  }, [navigate]);

  const loadComplaints = useCallback(() => {
    if (!user) return;
    setComplaintsLoading(true);
    fetchMyComplaints()
      .then((res) => setComplaints(res.complaints || []))
      .catch(() => setComplaints([]))
      .finally(() => setComplaintsLoading(false));
  }, [user]);

  const [tankerBookings, setTankerBookings] = useState([]);
  const [garbageBookings, setGarbageBookings] = useState([]);

  const loadRequests = useCallback(() => {
    if (!user) return;
    setRequestsLoading(true);
    fetchMyRequests()
      .then((res) => setRequests(res.requests || []))
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));

    fetchMyGarbageBookings()
      .then((res) => setGarbageBookings(res.bookings || []))
      .catch(() => setGarbageBookings([]));

    fetchMyTankerBookings()
      .then((res) => setTankerBookings(res.bookings || []))
      .catch(() => setTankerBookings([]));
  }, [user]);

  const handleServiceRatingSubmit = async ({ requestId, type, rating, review }) => {
    await submitServiceRating({ requestId, type, rating, review });
    loadRequests();
  };

  const hasAcceptedRequest = useMemo(() => {
    const isAccepted = (s) =>
      (s || '').toLowerCase().includes('accepted') ||
      (s || '').toLowerCase().includes('shortly');
    return (
      requests.some((r) => isAccepted(r.status)) ||
      garbageBookings.some((b) => isAccepted(b.status))
    );
  }, [requests, garbageBookings]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);
  useEffect(() => { loadRequests(); }, [loadRequests]);

  // Resolved by the officer and not yet rated: shown as notifications at the top of the dashboard.
  const complaintsToRate = complaints.filter((c) => c.status === 'Resolved' && !c.userFeedback?.rating);

  const filteredComplaints = complaints.filter((c) => {
    if (tab === 'all') return true;
    const solved = SOLVED_STATUSES.includes(c.status);
    return tab === 'solved' ? solved : !solved;
  });

  const profileIncomplete = !user || !user.firstName || !user.lastName || !user.dob || !user.contactNo || !user.streetAddress;
  const showProfileCard = isProfileOpen && (activeNav === 'profile' || profileIncomplete || activeNav === 'overview');

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError('');
    setProfileNotice('');
    setProfileSubmitting(true);
    try {
      const res = await completeProfile(profileForm);
      setUser(res.user);
      setProfileForm({
        firstName: res.user.firstName || '',
        lastName: res.user.lastName || '',
        dob: res.user.dob || '',
        contactNo: res.user.contactNo || '',
        streetAddress: res.user.streetAddress || '',
      });
      setProfileNotice(res.message || 'Profile saved successfully.');
      setIsProfileOpen(false);
      setActiveNav('overview');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  }

  function updateFeedbackDraft(complaintId, patch) {
    setFeedbackDrafts((prev) => ({ ...prev, [complaintId]: { ...prev[complaintId], ...patch } }));
  }

  async function handleFeedback(complaintId) {
    const draft = feedbackDrafts[complaintId] || {};
    if (!draft.rating) {
      setFeedbackError('Select a star rating before closing the complaint.');
      return;
    }
    setFeedbackError('');
    setFeedbackBusyId(complaintId);
    try {
      await submitComplaintFeedback(complaintId, { rating: draft.rating, comment: draft.comment?.trim() || undefined });
      setFeedbackDrafts((prev) => {
        const next = { ...prev };
        delete next[complaintId];
        return next;
      });
      loadComplaints();
    } catch (err) {
      setFeedbackError(err.message || 'Could not save your rating. Please try again.');
    } finally {
      setFeedbackBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <section className="section dashboard">
        <div className="container"><p>Loading your dashboard&hellip;</p></div>
      </section>
    );
  }

  return (
    <section className="section dashboard">
      <div className="container dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">S</span>
            <div>
              <strong>Smart City</strong>
              <small>Citizen Portal</small>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Dashboard navigation">
            <button
              type="button"
              className={`nav-button ${activeNav === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveNav('overview'); setIsProfileOpen(false); }}
            >
              Overview
            </button>
            <button
              type="button"
              className={`nav-button ${activeNav === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveNav('profile'); setIsProfileOpen(true); }}
            >
              {profileIncomplete ? 'Complete profile' : 'Edit profile'}
            </button>
            <button
              type="button"
              className={`nav-button ${activeNav === 'complaints' ? 'active' : ''}`}
              onClick={() => { setActiveNav('complaints'); setIsProfileOpen(false); }}
            >
              Complaints
            </button>
            <Link
              to="/services/water-tanker"
              className="nav-button"
              style={{ textDecoration: 'none', textAlign: 'left' }}
            >
              💧 Book Water Tanker
            </Link>
            <Link
              to="/services/garbage-van"
              className="nav-button"
              style={{ textDecoration: 'none', textAlign: 'left' }}
            >
              🚛 Garbage Vans
            </Link>
          </nav>

          <button type="button" className="btn btn-outline sidebar-logout" onClick={handleLogout}>Log out</button>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">Welcome back</p>
              <h1>{user.firstName || 'Citizen'} {user.lastName || ''}</h1>
            </div>
          </div>

          {hasAcceptedRequest && (
            <div className="citizen-notification" role="alert">
              <span className="notif-alert-bell">🔔</span>
              <div className="notif-alert-content">
                <strong>Officer Notification Alert</strong>
                <p>Your request has been accepted by the officer. Service arriving shortly.</p>
              </div>
            </div>
          )}

          {complaintsToRate.map((c) => (
            <div key={c._id} className="citizen-notification complaint-resolved-alert" role="status">
              <span className="notif-alert-bell" aria-hidden="true">🔔</span>
              <div className="notif-alert-content">
                <strong>Complaint {c.complaintCode} has been resolved</strong>
                <p>
                  {c.categoryLabel}: {c.resolution?.solutionGiven || 'The officer has marked your complaint as complete.'}
                </p>
                {c.resolution?.afterPhotos?.length > 0 && (
                  <div className="notif-proof-row">
                    {c.resolution.afterPhotos.map((url) => (
                      <a key={url} href={assetUrl(url)} target="_blank" rel="noreferrer">
                        <img src={assetUrl(url)} alt="Proof of the completed work" className="notif-proof" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="feedback-row">
                  <span>Rate the resolution:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`star-btn ${n <= (feedbackDrafts[c._id]?.rating || 0) ? 'star-active' : ''}`}
                      aria-label={`Rate ${n} out of 5`}
                      aria-pressed={feedbackDrafts[c._id]?.rating === n}
                      onClick={() => updateFeedbackDraft(c._id, { rating: n })}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
                <textarea
                  className="feedback-comment"
                  rows={2}
                  maxLength={500}
                  placeholder="Comments on the resolution (optional)"
                  value={feedbackDrafts[c._id]?.comment || ''}
                  onChange={(e) => updateFeedbackDraft(c._id, { comment: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-primary feedback-submit"
                  disabled={!feedbackDrafts[c._id]?.rating || feedbackBusyId === c._id}
                  onClick={() => handleFeedback(c._id)}
                >
                  {feedbackBusyId === c._id ? 'Closing…' : 'Rate & close complaint'}
                </button>
              </div>
            </div>
          ))}
          {feedbackError && <p className="form-error" role="alert">{feedbackError}</p>}

          {showProfileCard && (
            <div className="dashboard-card profile-card">
              <div className="dashboard-card-header">
                <h2>Complete your profile details</h2>
                {profileIncomplete && <span className="status-pill status-pending">Action needed</span>}
              </div>

              {profileNotice && <p className="notice" role="status">{profileNotice}</p>}
              {profileError && <p className="form-error" role="alert">{profileError}</p>}

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <label className="field">
                  <span className="field-label">First name</span>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Last name</span>
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Date of birth</span>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm((f) => ({ ...f, dob: e.target.value }))}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Contact number</span>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    value={profileForm.contactNo}
                    onChange={(e) => setProfileForm((f) => ({ ...f, contactNo: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  />
                </label>

                <label className="field field-full">
                  <span className="field-label">Street address</span>
                  <textarea
                    rows={3}
                    required
                    value={profileForm.streetAddress}
                    onChange={(e) => setProfileForm((f) => ({ ...f, streetAddress: e.target.value }))}
                  />
                </label>

                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={profileSubmitting}>
                    {profileSubmitting ? 'Saving...' : 'Save profile'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setIsProfileOpen(false)}>
                    Close
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showProfileCard && (
            <div className="dashboard-grid dashboard-main-grid">
              <div className="dashboard-column">
                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h2>Your complaints</h2>
                    <div className="tabs">
                      {COMPLAINT_TABS.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          className={`tab ${tab === t.key ? 'active' : ''}`}
                          onClick={() => setTab(t.key)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {complaintsLoading ? (
                    <p className="muted">Loading complaints&hellip;</p>
                  ) : filteredComplaints.length === 0 ? (
                    <p className="muted">No complaints yet. <Link to="/register-complaint">Register a complaint</Link> to get started.</p>
                  ) : (
                    <ul className="complaint-list">
                      {filteredComplaints.map((c) => (
                        <li key={c._id} className="complaint-item">
                          <div className="complaint-top">
                            <span className={`status-pill ${COMPLAINT_STATUS_UI[c.status]?.className || 'status-pending'}`}>
                              {COMPLAINT_STATUS_UI[c.status]?.label || c.status}
                            </span>
                            <span className="complaint-ref">{c.complaintCode}</span>
                          </div>
                          <h3>{c.categoryLabel}</h3>
                          <p>{c.description}</p>
                          {Array.isArray(c.location?.coordinates) && (
                            <p className="complaint-location">
                              📍 {c.location.coordinates[1].toFixed(5)}, {c.location.coordinates[0].toFixed(5)}
                            </p>
                          )}

                          {c.resolution?.solutionGiven && (
                            <p className="complaint-location">Officer: {c.resolution.solutionGiven}</p>
                          )}
                          {c.resolution?.afterPhotos?.length > 0 && (
                            <div className="notif-proof-row">
                              {c.resolution.afterPhotos.map((url) => (
                                <a key={url} href={assetUrl(url)} target="_blank" rel="noreferrer">
                                  <img src={assetUrl(url)} alt="Resolution photo from the officer" className="notif-proof" />
                                </a>
                              ))}
                            </div>
                          )}
                          {c.status === 'Resolved' && !c.userFeedback?.rating && (
                            <p className="complaint-location">Resolved. Please rate it in the notification above.</p>
                          )}
                          {c.userFeedback?.rating && (
                            <p className="feedback-given">
                              You rated this {c.userFeedback.rating}/5{c.status === 'Closed' ? ' and closed the complaint' : ''}.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Civic Service Requests & Dynamic Department Bookings */}
                <div className="dashboard-card" style={{ marginTop: '20px' }}>
                  <div className="dashboard-card-header">
                    <h2>Civic Service Requests &amp; Department Orders</h2>
                    
                  </div>

                  {requestsLoading ? (
                    <p className="muted">Loading service requests&hellip;</p>
                  ) : requests.length === 0 && garbageBookings.length === 0 ? (
                    <p className="muted">
                      No service requests booked yet. Use the services panel to book water tankers or garbage vans.
                    </p>
                  ) : (
                    <div className="citizen-requests-list">
                      {/* Water Tanker / Standard Service Requests */}
                      {requests.map((r) => {
                        const isCompleted =
                          (r.status || '').toLowerCase().includes('completed') ||
                          r.status === 'resolved';

                        return (
                          <div key={r._id} className="citizen-request-item">
                            <div className="citizen-req-top">
                              <span className="citizen-req-ref">{r.referenceNo}</span>
                              {renderServiceStatusPill(r.status)}
                            </div>

                            <div className="citizen-req-meta">
                              <strong>
                                {r.type === 'water_tanker' ? '💧 Water Tanker Request' : '🚛 Garbage Van Request'}
                              </strong>
                              <span className="citizen-req-dept">
                                🏛️ Routed to: {r.routedDepartment || 'Water Supply and Drainage Department'}
                              </span>
                            </div>

                            <p className="citizen-req-address">📍 {r.address}</p>
                            {r.notes && <p className="citizen-req-notes">📝 {r.notes}</p>}

                            {/* Rating is offered once the request is completed */}
                            {isCompleted && (
                              <ServiceRating
                                requestId={r._id}
                                requestType={r.type || 'service_request'}
                                initialRating={r.rating}
                                onRatingSubmitted={handleServiceRatingSubmit}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Garbage Van Bookings */}
                      {garbageBookings.map((b) => {
                        const isCompleted =
                          (b.status || '').toLowerCase().includes('completed') ||
                          b.status === 'resolved';

                        return (
                          <div key={b._id} className="citizen-request-item">
                            <div className="citizen-req-top">
                              <span className="citizen-req-ref">{b.bookingId}</span>
                              {renderServiceStatusPill(b.status)}
                            </div>

                            <div className="citizen-req-meta">
                              <strong>🚛 Garbage Van Pickup</strong>
                              <span className="citizen-req-dept">
                                🏛️ Routed to: {b.routedDepartment || 'Sanitation Department'}
                              </span>
                            </div>

                            <p className="citizen-req-details">
                              Waste: <strong>{b.wasteLabels?.join(', ') || b.wasteLabel || 'Solid Waste'}</strong> • Volume: {b.volume} • Slot: {b.timeSlot}
                            </p>
                            <p className="citizen-req-address">
                              📍 {b.pickupAddress?.streetAddress || b.pickupAddress?.fullName || 'Registered Address'}
                            </p>

                            {/* Rating is offered once the request is completed */}
                            {isCompleted && (
                              <ServiceRating
                                requestId={b._id}
                                requestType="garbage_booking"
                                initialRating={b.rating}
                                onRatingSubmitted={handleServiceRatingSubmit}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="dashboard-column dashboard-column-right">
                <div className="dashboard-card quick-actions-card">
                  <div className="quick-actions-heading">
                    <h2>Citizen services</h2>
                    <span className="status-pill status-in-progress">Live</span>
                  </div>

                  <div className="quick-action-list">
                    <Link to="/register-complaint" className="quick-action-item">
                      <span className="quick-action-icon">📝</span>
                      <div>
                        <strong>Register a complaint</strong>
                        <small>Report civic issues and service problems</small>
                      </div>
                    </Link>
                    <Link to="/services/water-tanker" className="quick-action-item" style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                      <span className="quick-action-icon">💧</span>
                      <div>
                        <strong>Water Tanker Booking</strong>
                        <small>Select 1000L-20000L, source, pay cash/UPI &amp; track GPS</small>
                      </div>
                    </Link>
                    <Link to="/services/garbage-van" className="quick-action-item" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <span className="quick-action-icon">🚛</span>
                      <div>
                        <strong>Garbage Vans</strong>
                        <small>Schedule municipal waste and debris pickup</small>
                      </div>
                    </Link>
                  </div>

                  {/* Active Tanker Bookings with Live GPS Tracking */}
                  {tankerBookings.length > 0 && (
                    <div className="tanker-bookings-live-section" style={{ marginTop: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                          📍 Live Tanker Orders ({tankerBookings.length})
                        </h3>
                        <Link to="/services/water-tanker" style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 700 }}>
                          + Book Another
                        </Link>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {tankerBookings.map((b) => (
                          <div
                            key={b._id}
                            style={{
                              background: '#FFFFFF',
                              border: '1.5px solid #BAE6FD',
                              borderRadius: '12px',
                              padding: '14px',
                              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284C7', fontSize: '0.85rem' }}>
                                #{b.bookingId}
                              </span>
                              <span className="status-pill status-in-progress" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                {b.status}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#0F172A', marginBottom: '2px' }}>
                              💧 {b.quantity?.toLocaleString()}L Tanker from {b.waterSource?.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '8px' }}>
                              Driver: <strong>{b.driver?.name}</strong> ({b.driver?.vehicleNo}) • Total: <strong>₹{b.pricing?.totalAmount}</strong> ({b.payment?.method?.toUpperCase()})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}

function renderServiceStatusPill(status = '') {
  const s = (status || '').toLowerCase();
  if (s.includes('accepted') || s.includes('shortly')) {
    return (
      <span className="status-pill status-accepted-shortly">
        Request Accepted.arriving shortly
      </span>
    );
  }
  if (s.includes('completed') || s === 'resolved') {
    return <span className="status-pill status-completed-pill">Completed</span>;
  }
  return <span className="status-pill status-submitted-pill">Request Submitted</span>;
}
