import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.jsx';
import { registerComplaint } from '../services/complaints/index.js';
import './RegisterComplaint.css';

const CIVIC_CATEGORIES = [
  { id: 'water', label: '💧 Water Supply & Leakage', desc: 'Broken pipe, low pressure, dirty water' },
  { id: 'garbage', label: '🗑️ Garbage & Solid Waste', desc: 'Unattended dustbins, public garbage dumping' },
  { id: 'roads', label: '🚧 Potholes & Road Damage', desc: 'Dangerous craters, damaged asphalt' },
  { id: 'lights', label: '💡 Streetlights & Electricity', desc: 'Dead streetlight pole, sparking wire' },
  { id: 'drainage', label: '🌊 Drainage & Sewer Overflow', desc: 'Choked manhole, gutter water backflow' },
  { id: 'health', label: '🏥 Public Health & Sanitation', desc: 'Mosquito breeding, stray animal menace' },
];

export default function RegisterComplaint() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [category, setCategory] = useState('water');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState('Ward 4 - CIDCO');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedComplaint, setConfirmedComplaint] = useState(null);

  useEffect(() => {
    if (user?.streetAddress) {
      setLocation(user.streetAddress);
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/citizen-login');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const selectedCat = CIVIC_CATEGORIES.find((c) => c.id === category);
      const res = await registerComplaint({
        category: selectedCat?.label || 'Civic Issue',
        title: title || `${selectedCat?.label} reported at ${ward}`,
        description,
        location: `${location}, ${ward}`,
      });

      setConfirmedComplaint(res.complaint);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-complaint-page">
      <section className="rc-hero-bar">
        <div className="container">
          <span className="badge-govt">Grievance Redressal Cell</span>
          <h1>📝 Register a Citizen Complaint</h1>
          <p className="rc-hero-sub">
            Lodge complaints directly with Chhatrapati Sambhajinagar Municipal Corporation.
            Track resolution status, officer progress, and inspect before/after proofs.
          </p>
        </div>
      </section>

      <div className="container rc-content-wrap">
        <div className="rc-form-card">
          <h2>Lodge Civic Complaint</h2>
          <p className="rc-sub">Your complaint will be routed to the respective ward engineer immediately</p>

          {error && <div className="checkout-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Category Grid */}
            <div className="rc-field-group">
              <label className="rc-label">1. Choose Issue Category</label>
              <div className="rc-cat-grid">
                {CIVIC_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className={`rc-cat-card ${category === cat.id ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <strong>{cat.label}</strong>
                    <p>{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Title & Description */}
            <div className="rc-field-group">
              <label className="rc-label">2. Problem Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Major water pipeline leakage near central bus stand"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rc-input"
              />
            </div>

            <div className="rc-field-group">
              <label className="rc-label">3. Detailed Description</label>
              <textarea
                rows={4}
                required
                placeholder="Describe the exact location, duration of the issue, and severity..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rc-textarea"
              />
            </div>

            {/* Ward & Address */}
            <div className="rc-two-col">
              <div className="rc-field-group">
                <label className="rc-label"> Zone</label>
                <select value={ward} onChange={(e) => setWard(e.target.value)} className="rc-select">
                  <option value="A 1 Town Hall">A 1 Town Hall</option>
                  <option value="B 5 Cidco N6">B 5 Cidco N6</option>
                  <option value="C 3 Central Naka">C 3 Central Naka</option>
                  <option value="D 9 Krantichowk">D 9 Krantichowk</option>
                  <option value="E 6 Cidco N6">E 6 Cidco N6</option>
                  <option value="F 7 Jawahar Colony">F 7 Jawahar Colony</option>
                  <option value="G 2 Mondha Naka Sille Khana">G 2 Mondha Naka Sille Khana</option>
                  <option value="H 4 Saubhagya Mangalkaryalya ">H 4 Saubhagya Mangalkaryalya</option>
                  <option value="I 8 Satara Parisar">I 8 Satara Parisar</option>
                </select>
              </div>

              <div className="rc-field-group">
                <label className="rc-label">Specific Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beside Shivaji Statue, Osmanpura Circle"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rc-input"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary rc-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting Grievance...' : 'Submit Complaint to CSMC →'}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmed Modal */}
      {confirmedComplaint && (
        <div className="modal-backdrop">
          <div className="order-confirmed-modal">
            <div className="confetti-icon">📋</div>
            <span className="confirmed-badge">Registered</span>
            <h2>Grievance Registered!</h2>
            <p className="confirmed-booking-id">
              Tracking Code: <strong>{confirmedComplaint.complaintCode}</strong>
            </p>

            <div className="confirmed-details-card">
              <div className="detail-line">
                <span>Issue:</span>
                <strong>{confirmedComplaint.title}</strong>
              </div>
              <div className="detail-line">
                <span>Ward &amp; Location:</span>
                <strong>{confirmedComplaint.location?.address}</strong>
              </div>
              <div className="detail-line">
                <span>Status:</span>
                <span className="status-pill status-pending">Pending Routing</span>
              </div>
            </div>

            <div className="confirmed-actions">
              <Link to="/dashboard" className="btn btn-primary">
                View in Citizen Dashboard
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setConfirmedComplaint(null)}
              >
                Register Another Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
