import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { fetchComplaintCategories, registerComplaint } from '../services/complaints/index.js';
import MapView from '../components/MapView.jsx';
import './RegisterComplaint.css';

const MIN_TEXT = 10;
const MAX_TEXT = 1000;

export default function RegisterComplaint() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [coords, setCoords] = useState(null); // { lat, lng, source: 'gps' | 'manual' }
  const [needPin, setNeedPin] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedComplaint, setConfirmedComplaint] = useState(null);

  useEffect(() => {
    fetchComplaintCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => setError('Could not load complaint categories. Please refresh the page.'));

    // Ask for GPS in the background so it is ready as a fallback when the photo has no EXIF location.
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords((c) => c || { lat: p.coords.latitude, lng: p.coords.longitude, source: 'gps' }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!image) return undefined;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function resetForm(form) {
    setCategory('');
    setDescription('');
    setImage(null);
    setPreview('');
    setNeedPin(false);
    setCoords((c) => (c?.source === 'manual' ? null : c)); // a map pin belongs to one complaint only
    form.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!category) {
      setError('Please choose an issue category.');
      return;
    }

    const form = e.currentTarget;
    setError('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('category', category);
      fd.append('description', description.trim());
      fd.append('image', image);
      if (coords) {
        fd.append('lat', coords.lat);
        fd.append('lng', coords.lng);
        fd.append('locationSource', coords.source);
      }

      const res = await registerComplaint(fd);
      setConfirmedComplaint({ ...res.complaint, message: res.message });
      resetForm(form);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (err) {
      if (err.code === 'LOCATION_REQUIRED' || (err.code === 'OUT_OF_CITY' && err.data?.source !== 'exif')) {
        // No usable location: let the citizen pin it on the map.
        setCoords(null);
        setNeedPin(true);
      }
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const textLength = description.trim().length;
  const canSubmit = !submitting && image && textLength >= MIN_TEXT && (!needPin || coords);

  return (
    <div className="register-complaint-page">
      <section className="rc-hero-bar">
        <div className="container">
          <span className="badge-govt">Grievance Redressal Cell</span>
          <h1>📝 Register a Citizen Complaint</h1>
          <p className="rc-hero-sub">
            Lodge complaints directly with Chhatrapati Sambhajinagar Municipal Corporation.
            Your photo and its location are verified automatically and routed to the right department.
          </p>
        </div>
      </section>

      <div className="container rc-content-wrap">
        <div className="rc-form-card">
          <h2>Lodge Civic Complaint</h2>
          <p className="rc-sub">Choose a category, upload a photo of the problem and describe it</p>

          {error && <div className="checkout-error-banner" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="rc-field-group">
              <span className="rc-label">1. Choose Issue Category</span>
              <div className="rc-cat-grid" role="radiogroup" aria-label="Issue category">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    role="radio"
                    aria-checked={category === cat.key}
                    className={`rc-cat-card ${category === cat.key ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.key)}
                  >
                    <strong>{cat.label}</strong>
                    <p>{cat.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-field-group">
              <label className="rc-label" htmlFor="rc-photo">2. Photo of the Problem</label>
              <input
                id="rc-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="rc-input"
                onChange={(e) => setImage(e.target.files[0] || null)}
              />
              <p className="rc-help">
                Take the photo at the problem spot. Its location is read from the photo, or from your device GPS.
              </p>
              {image && preview && <img src={preview} alt="Selected complaint" className="rc-photo-preview" />}
            </div>

            <div className="rc-field-group">
              <label className="rc-label" htmlFor="rc-description">3. Describe the Problem</label>
              <textarea
                id="rc-description"
                rows={4}
                required
                minLength={MIN_TEXT}
                maxLength={MAX_TEXT}
                placeholder="Describe the exact spot, how long the issue has existed, and how severe it is..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rc-textarea"
              />
              <p className="rc-help">{textLength}/{MAX_TEXT} characters (minimum {MIN_TEXT})</p>
            </div>

            {needPin && (
              <div className="rc-field-group">
                <span className="rc-label">4. Pin the Problem Location</span>
                <p className="rc-help">Tap the map where the problem is, then submit again.</p>
                <MapView pin={coords} onPick={(lat, lng) => setCoords({ lat, lng, source: 'manual' })} />
                {coords && (
                  <p className="rc-help">Pinned at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary rc-submit-btn" disabled={!canSubmit}>
              {submitting ? 'Verifying & Submitting...' : 'Submit Complaint to CSMC →'}
            </button>
          </form>
        </div>
      </div>

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
                <span>Category:</span>
                <strong>{confirmedComplaint.categoryLabel}</strong>
              </div>
              <div className="detail-line">
                <span>Status:</span>
                <span className="status-pill status-pending">
                  {confirmedComplaint.status === 'Pending Review'
                    ? `Routed to ${confirmedComplaint.department}`
                    : 'Under admin verification'}
                </span>
              </div>
            </div>
            <p className="rc-help">{confirmedComplaint.message}</p>

            <div className="confirmed-actions">
              <Link to="/dashboard" className="btn btn-primary">
                View in Citizen Dashboard
              </Link>
              <button type="button" className="btn btn-outline" onClick={() => setConfirmedComplaint(null)}>
                Register Another Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
