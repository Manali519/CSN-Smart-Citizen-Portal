import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, logout, completeProfile } from '../api/auth.js';
import { fetchMyComplaints, submitComplaintFeedback } from '../services/complaints/index.js';
import { fetchMyRequests, createServiceRequest } from '../api/requests.js';
import { fetchMyTankerBookings, fetchMyGarbageBookings } from '../services/bookings/index.js';
import { submitServiceRating } from '../services/officer/index.js';
import ServiceRating from '../components/ServiceRating.jsx';
import './Dashboard.css';

const COMPLAINT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'solved', label: 'Solved' },
];

const TANKER_OPTIONS = [5000, 10000, 20000];
const TANKER_SOURCES = ['Municipal Supply', 'Certified Borewell', 'Tanker Yard'];
const PAYMENT_METHODS = ['UPI', 'Cards', 'NetBanking'];

const EMPTY_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  contactNo: '',
  streetAddress: '',
};

export default function Dashboard() {
  const navigate = useNavigate();

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

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [reqForm, setReqForm] = useState({ type: 'water_tanker', address: '', preferredDate: '', notes: '' });
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqNotice, setReqNotice] = useState('');

  const [selectedQuantity, setSelectedQuantity] = useState(10000);
  const [selectedSource, setSelectedSource] = useState('Municipal Supply');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [etaMinutes, setEtaMinutes] = useState(45);

  const prices = useMemo(() => ({
    5000: 1499,
    10000: 2799,
    20000: 5299,
  }), []);

  const bookingSummary = useMemo(() => {
    const basePrice = prices[selectedQuantity] || prices[10000];
    const distanceFee = selectedQuantity >= 20000 ? 799 : 450;
    const serviceFee = 199;
    const taxes = Math.round((basePrice + distanceFee + serviceFee) * 0.05);
    const total = basePrice + distanceFee + serviceFee + taxes;
    return { basePrice, distanceFee, serviceFee, taxes, total };
  }, [prices, selectedQuantity]);

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
        setReqForm((f) => ({ ...f, address: currentUser.streetAddress || '' }));
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

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((current) => (current > 1 ? current - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadComplaints = useCallback(() => {
    if (!user) return;
    setComplaintsLoading(true);
    fetchMyComplaints()
      .then((res) => setComplaints(res.complaints || []))
      .catch(() => setComplaints([]))
      .finally(() => setComplaintsLoading(false));
  }, [user]);

  const [tankerBookings, setTankerBookings] = useState([]);
  const [tankerLoading, setTankerLoading] = useState(false);
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

    setTankerLoading(true);
    fetchMyTankerBookings()
      .then((res) => setTankerBookings(res.bookings || []))
      .catch(() => setTankerBookings([]))
      .finally(() => setTankerLoading(false));
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

  const filteredComplaints = complaints.filter((c) => {
    if (tab === 'all') return true;
    if (tab === 'solved') return c.status === 'resolved';
    return c.status !== 'resolved';
  });

  const profileIncomplete = !user || !user.firstName || !user.lastName || !user.dob || !user.contactNo || !user.streetAddress;
  const showProfileCard = isProfileOpen && (activeNav === 'profile' || profileIncomplete || activeNav === 'overview');

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
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
      setReqForm((f) => ({ ...f, address: res.user.streetAddress || f.address }));
      setIsProfileOpen(false);
      setActiveNav('overview');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handleRequestSubmit(e) {
    e.preventDefault();
    setReqError('');
    setReqNotice('');
    setReqSubmitting(true);
    try {
      const res = await createServiceRequest({
        ...reqForm,
        type: 'water_tanker',
        address: user?.streetAddress || reqForm.address || '',
        preferredDate: new Date(Date.now() + etaMinutes * 60000).toISOString(),
        notes: `Water quantity: ${selectedQuantity}L | Source: ${selectedSource} | Payment: ${paymentMethod}`,
      });
      setReqNotice(`Water tanker booked — reference ${res.request.referenceNo}.`);
      setReqForm((f) => ({ ...f, notes: '' }));
      loadRequests();
      setActiveNav('overview');
    } catch (err) {
      setReqError(err.message);
    } finally {
      setReqSubmitting(false);
    }
  }

  async function handleFeedback(complaintId, rating) {
    try {
      await submitComplaintFeedback(complaintId, { rating });
      loadComplaints();
    } catch {
      // no-op
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
            <button
              type="button"
              className={`nav-button ${activeNav === 'my-bookings' ? 'active' : ''}`}
              onClick={() => { setActiveNav('my-bookings'); setIsProfileOpen(false); }}
            >
              📍 Active Bookings ({tankerBookings.length})
            </button>
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
            <div className="citizen-mock-notification-alert" role="alert">
              <span className="notif-alert-bell">🔔</span>
              <div className="notif-alert-content">
                <strong>Officer Notification Alert</strong>
                <p>Your request has been accepted by the officer. Service arriving shortly.</p>
              </div>
            </div>
          )}

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
                            <span className={`status-pill status-${c.status}`}>{formatStatus(c.status)}</span>
                            <span className="complaint-ref">{c.referenceNo}</span>
                          </div>
                          <h3>{c.category}</h3>
                          <p>{c.description}</p>
                          <p className="complaint-location">{c.location}</p>

                          {c.status === 'resolved' && !c.feedback?.rating && (
                            <div className="feedback-row">
                              <span>Rate the resolution:</span>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" className="star-btn" onClick={() => handleFeedback(c._id, n)}>
                                  &#9733;
                                </button>
                              ))}
                            </div>
                          )}
                          {c.feedback?.rating && (
                            <p className="feedback-given">You rated this {c.feedback.rating}/5.</p>
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
                    <span className="status-pill status-in-progress">
                      {requests.length + garbageBookings.length} Active
                    </span>
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

                            {/* Requirement 3: Reveal rating interface component on Completed status */}
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

                            {/* Requirement 3: Reveal rating interface component on Completed status */}
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
                        <strong>Water Tanker (Zomato-Style)</strong>
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

                            <Link
                              to={`/track-tanker/${b.bookingId}`}
                              className="btn btn-primary"
                              style={{
                                display: 'block',
                                textAlign: 'center',
                                textDecoration: 'none',
                                padding: '8px 14px',
                                fontSize: '0.84rem',
                                fontWeight: 750,
                                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                                borderRadius: '8px',
                              }}
                            >
                              🚀 Track Tanker Live (Zomato GPS) &rarr;
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="tanker-card">
                    <div className="tanker-header-row">
                      <div>
                        <p className="tanker-kicker">Water delivery</p>
                        <h3>Book Your Tanker</h3>
                      </div>
                      <span className="tanker-badge">Verified</span>
                    </div>

                    <div className="tanker-section">
                      <div className="section-label-row">
                        <span className="section-label">Water quantity</span>
                        <span className="section-detail">{selectedQuantity.toLocaleString()} L</span>
                      </div>
                      <div className="stepper-group">
                        {TANKER_OPTIONS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={`quantity-chip ${selectedQuantity === amount ? 'selected' : ''}`}
                            onClick={() => setSelectedQuantity(amount)}
                          >
                            {amount.toLocaleString()}L
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tanker-grid">
                      <div className="info-box">
                        <span className="info-label">ETA</span>
                        <strong>Arriving in {etaMinutes} mins</strong>
                      </div>
                      <div className="info-box">
                        <span className="info-label">Source</span>
                        <strong>{selectedSource}</strong>
                      </div>
                    </div>

                    <div className="tanker-section">
                      <div className="section-label-row">
                        <span className="section-label">Verified source</span>
                        <span className="section-detail">{selectedSource}</span>
                      </div>
                      <div className="source-selector">
                        {TANKER_SOURCES.map((source) => (
                          <button
                            key={source}
                            type="button"
                            className={`source-pill ${selectedSource === source ? 'active' : ''}`}
                            onClick={() => setSelectedSource(source)}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tanker-section">
                      <div className="section-label-row">
                        <span className="section-label">Price details</span>
                        <span className="section-detail">₹{bookingSummary.total}</span>
                      </div>
                      <div className="price-list">
                        <div><span>Base price</span><strong>₹{bookingSummary.basePrice}</strong></div>
                        <div><span>Distance & surge</span><strong>₹{bookingSummary.distanceFee}</strong></div>
                        <div><span>Service fee</span><strong>₹{bookingSummary.serviceFee}</strong></div>
                        <div><span>Taxes</span><strong>₹{bookingSummary.taxes}</strong></div>
                      </div>
                    </div>

                    <div className="tanker-section">
                      <div className="section-label-row">
                        <span className="section-label">Payment</span>
                      </div>
                      <div className="payment-row">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            className={`payment-pill ${paymentMethod === method ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod(method)}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {reqNotice && <p className="notice" role="status">{reqNotice}</p>}
                    {reqError && <p className="form-error" role="alert">{reqError}</p>}

                    <div className="checkout-sheet">
                      <div className="checkout-summary">
                        <div>
                          <span>Order total</span>
                          <strong>₹{bookingSummary.total}</strong>
                        </div>
                        <div>
                          <span>Delivery</span>
                          <strong>{etaMinutes} mins</strong>
                        </div>
                      </div>
                      <button type="button" className="btn btn-primary checkout-btn" onClick={handleRequestSubmit} disabled={reqSubmitting}>
                        {reqSubmitting ? 'Booking...' : `Proceed to pay via ${paymentMethod}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}

function formatStatus(status) {
  return status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
