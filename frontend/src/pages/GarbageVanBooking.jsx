import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.jsx';
import { bookGarbageVan, fetchMyGarbageBookings } from '../services/bookings/index.js';
import './GarbageVanBooking.css';

const WASTE_CATEGORIES = [
  {
    id: 'dry',
    title: '📦 Dry Recyclable Waste',
    desc: 'Paper, cardboard, plastics, metals, glass bottles, and dry packaging.',
    icon: '📦',
  },
  {
    id: 'wet',
    title: '🥬 Wet & Kitchen Organic Waste',
    desc: 'Food leftovers, vegetable peels, garden leaves, and compostable waste.',
    icon: '🥬',
  },
  {
    id: 'electronic',
    title: '💻 Electronic & E-Waste',
    desc: 'Old phones, chargers, computer parts, batteries, cables, small electronics.',
    icon: '💻',
  },
  {
    id: 'bulk_debris',
    title: '🧱 Bulk Debris & Renovation Waste',
    desc: 'Tiles, broken brick, concrete rubble, large branches, old furniture.',
    icon: '🧱',
  },
];

const VOLUMES = [
  { id: '1_2_bins', label: '1 - 2 Standard Bins', desc: 'Household weekly collection' },
  { id: 'community_dumpster', label: 'Community / Society Bin (240L)', desc: 'Apartment complex shared pickup' },
  { id: 'half_truck', label: 'Medium Van Load (500 kg)', desc: 'Post-event or shop cleanup' },
  { id: 'full_truck', label: 'Full Municipal Truck (1.5 Ton)', desc: 'Heavy renovation / tree pruning' },
];

export default function GarbageVanBooking() {
  const { user } = useAuth();

  // Multi-select: array of selected category IDs
  const [selectedTypes, setSelectedTypes] = useState(['dry']);
  const [selectedVolume, setSelectedVolume] = useState('1_2_bins');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('Morning 07:00 AM - 09:00 AM');
  const [notes, setNotes] = useState('');

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    contactNo: '',
    streetAddress: '',
    ward: 'Satara Parisar - I 8',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    if (user) {
      setAddressForm({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citizen',
        contactNo: user.contactNo || '',
        streetAddress: user.streetAddress || '',
        ward: 'Satara Parisar - I 8',
      });
      loadMyBookings();
    }
  }, [user]);

  function loadMyBookings() {
    fetchMyGarbageBookings()
      .then((res) => {
        if (res.bookings) setMyBookings(res.bookings);
      })
      .catch(() => { });
  }

  /** Toggle a waste category in/out of the multi-select set */
  function toggleCategory(catId) {
    setSelectedTypes((prev) => {
      if (prev.includes(catId)) {
        // Don't allow deselecting the last category
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (selectedTypes.length === 0) {
      setError('Please select at least one waste category.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const selectedCats = WASTE_CATEGORIES.filter((c) => selectedTypes.includes(c.id));
      const vol = VOLUMES.find((v) => v.id === selectedVolume);

      const payload = {
        // Multi-category: send arrays for types and labels
        wasteType: selectedTypes[0],
        wasteTypes: selectedTypes,
        wasteLabel: selectedCats.map((c) => c.title).join(', '),
        wasteLabels: selectedCats.map((c) => c.title),
        volume: vol?.label || '1 - 2 Bins',
        pickupAddress: addressForm,
        pickupDate: new Date(pickupDate),
        timeSlot,
        notes,
      };

      const res = await bookGarbageVan(payload);
      setBookingConfirmed(res.booking);
      loadMyBookings();

      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule pickup.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="garbage-van-page">
      <section className="gv-hero-bar">
        <div className="container">
          <span className="badge-govt">Swachh CSMC Civic Initiative</span>
          <h1>🚛 Municipal Garbage Van Pickup</h1>
          <p className="gv-hero-sub">
            Schedule door to door municipal collection for dry recyclables, compostable waste,
            e-waste, or bulky renovation debris. Assigned CSMC electric vans with SMS tracking.
          </p>
        </div>
      </section>

      <div className="container gv-content-grid">
        {/* Left: Booking Form */}
        <div className="gv-form-card">
          <h2>Schedule Waste Pickup</h2>
          <p className="form-subtext">Free civic municipal service for verified citizens</p>

          {error && <div className="checkout-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Multi-Select Category */}
            <div className="gv-step-section">
              <label className="gv-step-title">1. Select Waste Categories <span className="multi-hint">(select one or more)</span></label>
              <div className="waste-category-grid">
                {WASTE_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className={`waste-cat-card ${selectedTypes.includes(cat.id) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                    role="checkbox"
                    aria-checked={selectedTypes.includes(cat.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(cat.id); } }}
                  >
                    <span className="cat-check">{selectedTypes.includes(cat.id) ? '☑' : '☐'}</span>
                    <span className="cat-icon">{cat.icon}</span>
                    <div className="cat-text">
                      <strong>{cat.title}</strong>
                      <p>{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTypes.length > 1 && (
                <div className="selected-chips-bar">
                  {selectedTypes.map((id) => {
                    const cat = WASTE_CATEGORIES.find((c) => c.id === id);
                    return (
                      <span key={id} className="selected-chip">
                        {cat?.icon} {cat?.title.replace(/^[^\s]+\s/, '')}
                        <button type="button" className="chip-remove" onClick={() => toggleCategory(id)} aria-label={`Remove ${cat?.title}`}>&times;</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Volume */}
            <div className="gv-step-section">
              <label className="gv-step-title">2. Estimated Waste Volume</label>
              <div className="volume-options-grid">
                {VOLUMES.map((v) => (
                  <div
                    key={v.id}
                    className={`vol-card ${selectedVolume === v.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVolume(v.id)}
                  >
                    <strong>{v.label}</strong>
                    <small>{v.desc}</small>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Date & Slot */}
            <div className="gv-step-section">
              <label className="gv-step-title">3. Date &amp; Preferred Time Slot</label>
              <div className="date-slot-grid">
                <label className="gv-field">
                  <span>Pickup Date</span>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </label>

                <label className="gv-field">
                  <span>Time Slot</span>
                  <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                    <option value="Morning 07:00 AM - 09:00 AM">Morning 07:00 AM - 09:00 AM</option>
                    <option value="Morning 09:00 AM - 11:30 AM">Morning 09:00 AM - 11:30 AM</option>
                    <option value="Afternoon 02:00 PM - 04:30 PM">Afternoon 02:00 PM - 04:30 PM</option>
                    <option value="Evening 05:00 PM - 07:00 PM">Evening 05:00 PM - 07:00 PM</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Step 4: Address */}
            <div className="gv-step-section">
              <label className="gv-step-title">4. Pickup Location</label>
              <div className="address-inputs-grid">
                <label className="gv-field">
                  <span>Contact Person</span>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  />
                </label>

                <label className="gv-field">
                  <span>Mobile Number</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={addressForm.contactNo}
                    onChange={(e) => setAddressForm({ ...addressForm, contactNo: e.target.value.replace(/\D/g, '') })}
                  />
                </label>

                <label className="gv-field field-full">
                  <span>Street Address</span>
                  <input
                    type="text"
                    required
                    placeholder="House/Apartment number, street name"
                    value={addressForm.streetAddress}
                    onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  />
                </label>

                <label className="gv-field">
                  <span>Zone</span>
                  <select
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                  >
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
                </label>

                <label className="gv-field field-full">
                  <span>Special Instructions (Optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. Left near society main entrance"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary gv-submit-btn" disabled={submitting}>
              {submitting ? 'Scheduling Pickup...' : `Schedule Municipal Van Pickup (${selectedTypes.length} categor${selectedTypes.length > 1 ? 'ies' : 'y'}) →`}
            </button>
          </form>
        </div>

        {/* Right: Info & Recent Bookings */}
        <div className="gv-sidebar">
          <div className="gv-info-card">
            <h3>🌱 CSMC Clean City Protocol</h3>
            <ul className="civic-tips-list">
              <li>Keep dry and wet waste segregated in separate bins.</li>
              <li>E-waste (batteries &amp; bulbs) must be packed safely in a bag.</li>
              <li>The van pilot will call 10 minutes prior to arrival.</li>
              <li>Free service managed under Swachh Chhatrapati Sambhajinagar Abhiyan.</li>
            </ul>
          </div>

          {/* Recent Scheduled Pickups */}
          {myBookings.length > 0 && (
            <div className="gv-history-card">
              <h3>Your Scheduled Pickups</h3>
              <ul className="history-list">
                {myBookings.map((b) => (
                  <li key={b._id} className="history-item">
                    <div className="history-item-top">
                      <span className="history-ref">{b.bookingId}</span>
                      <span className="status-pill status-in-progress">{b.status}</span>
                    </div>
                    <strong>{b.wasteLabel}</strong>
                    <small>
                      {new Date(b.pickupDate).toLocaleDateString()} • {b.timeSlot}
                    </small>
                    <div className="van-info-tag">
                      Van: <strong>{b.assignedVan?.vanNumber}</strong> ({b.assignedVan?.driverName})
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Success Confirmation Modal ── */}
      {bookingConfirmed && (
        <div className="modal-backdrop">
          <div className="order-confirmed-modal gv-success-modal">
            <div className="confetti-icon success-check">✅</div>
            <span className="confirmed-badge success-badge">Success</span>
            <h2>Request submitted successfully!<br />Van Will arrive shortly.</h2>

            <div className="confirmed-details-card">
              <div className="detail-line">
                <span>Reference:</span>
                <strong>{bookingConfirmed.bookingId}</strong>
              </div>
              <div className="detail-line">
                <span>Waste Categories:</span>
                <strong>{bookingConfirmed.wasteLabel}</strong>
              </div>
              <div className="detail-line">
                <span>Date &amp; Slot:</span>
                <strong>
                  {new Date(bookingConfirmed.pickupDate).toLocaleDateString()} ({bookingConfirmed.timeSlot})
                </strong>
              </div>
              <div className="detail-line">
                <span>Location:</span>
                <strong>{bookingConfirmed.pickupAddress?.streetAddress}</strong>
              </div>
              <div className="detail-line detail-line-highlight">
                <span>Contact:</span>
                <strong>91XXXXXXXX</strong>
              </div>
              <div className="detail-line detail-line-highlight">
                <span>Van Number:</span>
                <strong>MH20XXXXXX</strong>
              </div>
            </div>

            <div className="confirmed-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setBookingConfirmed(null)}
              >
                Done
              </button>
              <Link to="/dashboard" className="btn btn-outline">
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
