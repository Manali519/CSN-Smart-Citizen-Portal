import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchWaterSources, bookWaterTanker } from '../services/bookings/index.js';
import './WaterTankerBooking.css';

const DEFAULT_SOURCES = [
  {
    id: 'jayakwadi-hub',
    name: 'Jayakwadi Dam Reservoir Hub',
    shortName: 'Jayakwadi Reservoir',
    type: 'Dam Reservoir',
    rating: 4.9,
    reviewsCount: 1840,
    distanceKm: 4.2,
    etaMinutes: 28,
    locationName: 'Paithan Feeder Canal Rd, South CSMC Zone',
    coordinates: { lat: 19.8350, lng: 75.3120 },
    waterQuality: {
      grade: 'potable_ro',
      label: 'Ultra-Pure RO + UV Mineral Enriched',
      tds: 92,
      ph: 7.2,
      hardness: '65 mg/L (Soft)',
      chlorine: '0.2 ppm (Safe)',
      certification: 'BIS IS 10500:2012 Certified',
      labReportDate: 'Today, 06:00 AM',
      labCertNo: 'CSMC-WTR-2026-9812',
    },
    tankerFleet: [
      { capacity: 1000, price: 449, type: 'Mini Tanker' },
      { capacity: 2000, price: 799, type: 'Standard Tanker' },
      { capacity: 5000, price: 1499, type: 'Family / Society Tanker' },
      { capacity: 10000, price: 2699, type: 'Heavy Multi-Axle Tanker' },
      { capacity: 20000, price: 4899, type: 'Bulk Industrial Tanker' },
    ],
    availableTankers: 9,
    tags: ['Drinking Water', 'CSMC Approved', 'Highest Purity', 'Best Seller'],
    badge: 'Municipal Grade A',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
    description: 'Direct from Jayakwadi Dam high-tech filtration works. Multi-stage sand filtration, activated carbon, and UV sterilisation for pure drinking water.',
  },
  {
    id: 'harsul-station',
    name: 'Harsul Lake Filtration Station',
    shortName: 'Harsul Lake Plant',
    type: 'Lake & Natural Catchment',
    rating: 4.8,
    reviewsCount: 1250,
    distanceKm: 3.1,
    etaMinutes: 20,
    locationName: 'Harsul T-Point, North Sambhajinagar',
    coordinates: { lat: 19.9125, lng: 75.3340 },
    waterQuality: {
      grade: 'potable_ro',
      label: 'Filtered Potable & Cooking Grade',
      tds: 135,
      ph: 7.4,
      hardness: '90 mg/L',
      chlorine: '0.2 ppm',
      certification: 'CSMC Health Lab Certified',
      labReportDate: 'Today, 07:15 AM',
      labCertNo: 'CSMC-WTR-2026-8741',
    },
    tankerFleet: [
      { capacity: 1000, price: 420, type: 'Mini Tanker' },
      { capacity: 2000, price: 749, type: 'Standard Tanker' },
      { capacity: 5000, price: 1399, type: 'Family Tanker' },
      { capacity: 10000, price: 2549, type: 'Heavy Duty Tanker' },
    ],
    availableTankers: 6,
    tags: ['Fastest ETA', 'Potable', 'North CSMC Fast Delivery'],
    badge: 'Express Hub',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    description: 'Servicing North Chh. Sambhajinagar, CIDCO N-series and Harsul. Fast dispatch with automated level metering.',
  },
  {
    id: 'salim-ali-aquifer',
    name: 'Salim Ali Lake Eco-Purified Aquifer',
    shortName: 'Salim Ali Station',
    type: 'Municipal Aquifer',
    rating: 4.7,
    reviewsCount: 890,
    distanceKm: 2.4,
    etaMinutes: 18,
    locationName: 'Near Delhi Gate, Central Sambhajinagar',
    coordinates: { lat: 19.8940, lng: 75.3420 },
    waterQuality: {
      grade: 'domestic_utility',
      label: 'Eco-Treated Domestic & Kitchen Utility',
      tds: 210,
      ph: 7.3,
      hardness: '110 mg/L',
      chlorine: '0.3 ppm',
      certification: 'CSMC Utility Standard Pass',
      labReportDate: 'Today, 08:00 AM',
      labCertNo: 'CSMC-WTR-2026-6420',
    },
    tankerFleet: [
      { capacity: 1000, price: 380, type: 'Mini Tanker' },
      { capacity: 2000, price: 699, type: 'Standard Tanker' },
      { capacity: 5000, price: 1299, type: 'Domestic Tanker' },
      { capacity: 10000, price: 2399, type: 'Large Utility Tanker' },
    ],
    availableTankers: 5,
    tags: ['Domestic Utility', 'Central Hub', 'Budget Friendly'],
    badge: 'Eco Pure',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    description: 'Ideal for household chores, overhead tank refills, gardening and residential societies.',
  },
  {
    id: 'chikalthana-midc-yard',
    name: 'MIDC Chikalthana Industrial & Commercial Yard',
    shortName: 'Chikalthana Yard',
    type: 'Industrial Treatment Complex',
    rating: 4.8,
    reviewsCount: 640,
    distanceKm: 5.5,
    etaMinutes: 35,
    locationName: 'Jalna Road, MIDC Industrial Area, East CSMC',
    coordinates: { lat: 19.8820, lng: 75.3950 },
    waterQuality: {
      grade: 'construction_raw',
      label: 'Industrial & Construction Raw Water',
      tds: 380,
      ph: 7.6,
      hardness: '180 mg/L',
      chlorine: '0.1 ppm',
      certification: 'Industrial Grade Compliant',
      labReportDate: 'Today, 06:30 AM',
      labCertNo: 'CSMC-IND-2026-4411',
    },
    tankerFleet: [
      { capacity: 5000, price: 1199, type: 'Bulk Utility Tanker' },
      { capacity: 10000, price: 2199, type: 'Heavy Construction Tanker' },
      { capacity: 20000, price: 3999, type: 'Dual-Axle Mega Tanker' },
    ],
    availableTankers: 8,
    tags: ['Heavy Duty', 'Commercial & Construction', 'Bulk Supply'],
    badge: 'Bulk Specialist',
    imageUrl: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?w=600&auto=format&fit=crop&q=80',
    description: 'High capacity tankers equipped with high-pressure booster pumps for construction sites, commercial setups and bulk storage.',
  },
];

const DEFAULT_ADDONS = [
  { id: 'extra_hose', name: '50ft Extended Booster Hose Pipe', price: 99, description: 'Reach 3rd floor overhead tanks without pressure drop' },
  { id: 'express_dispatch', name: 'Express Priority Rush (< 20 Mins)', price: 149, description: 'Direct queue-jump dispatch with dedicated traffic routing' },
  { id: 'tds_meter_test', name: 'Digital TDS & Purity Test on Arrival', price: 49, description: 'Driver tests TDS & pH in front of you with digital meter' },
];

export default function WaterTankerBooking() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [addonsList, setAddonsList] = useState(DEFAULT_ADDONS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Customizer Modal State
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(5000);
  const [selectedQuality, setSelectedQuality] = useState('potable_ro');
  const [selectedAddons, setSelectedAddons] = useState(['extra_hose']);
  const [deliverySlot, setDeliverySlot] = useState('Immediate (25-35 mins)');

  // Cart State (Zomato-style)
  const [cart, setCart] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Checkout & Payment State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cash'
  const [upiId, setUpiId] = useState('');
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    contactNo: '',
    streetAddress: '',
    landmark: '',
    ward: 'Ward 4 - CIDCO',
    pincode: '431001',
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  // Sync user profile into address form
  useEffect(() => {
    if (user) {
      setAddressForm((prev) => ({
        fullName: prev.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citizen',
        contactNo: prev.contactNo || user.contactNo || '',
        streetAddress: prev.streetAddress || user.streetAddress || '',
        landmark: prev.landmark || '',
        ward: prev.ward || 'Ward 4 - CIDCO',
        pincode: prev.pincode || '431001',
      }));
    }
  }, [user]);

  // Load sources from backend API
  useEffect(() => {
    fetchWaterSources()
      .then((res) => {
        if (res.sources?.length) setSources(res.sources);
        if (res.addons?.length) setAddonsList(res.addons);
      })
      .catch(() => {
        // Fallback to rich embedded defaults
      });
  }, []);

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.waterQuality.label.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'top_rated') return s.rating >= 4.8;
      if (activeFilter === 'fast_eta') return s.etaMinutes <= 22;
      if (activeFilter === 'potable') return s.waterQuality.grade === 'potable_ro';
      if (activeFilter === 'bulk') return s.tankerFleet.some((f) => f.capacity >= 10000);
      return true;
    });
  }, [sources, searchQuery, activeFilter]);

  // Handle open customizer modal
  function openCustomizer(source) {
    setSelectedSource(source);
    // Default to middle or best seller quantity
    const defaultQty = source.tankerFleet.some((f) => f.capacity === 5000) ? 5000 : source.tankerFleet[0].capacity;
    setSelectedQuantity(defaultQty);
    setSelectedQuality(source.waterQuality.grade || 'potable_ro');
    setSelectedAddons([]);
  }

  function closeCustomizer() {
    setSelectedSource(null);
  }

  // Calculate pricing inside customizer
  const activeCustomizerPrice = useMemo(() => {
    if (!selectedSource) return { base: 0, addons: 0, delivery: 0, tax: 0, total: 0 };
    const fleetItem = selectedSource.tankerFleet.find((f) => f.capacity === selectedQuantity) || selectedSource.tankerFleet[0];
    const base = fleetItem ? fleetItem.price : 449;
    const addons = addonsList
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    const delivery = Math.round((selectedSource.distanceKm || 3.5) * 28);
    const service = 49;
    const tax = Math.round((base + addons + delivery + service) * 0.05);
    const total = base + addons + delivery + service + tax;
    return { base, addons, delivery, service, tax, total };
  }, [selectedSource, selectedQuantity, selectedAddons, addonsList]);

  // Add to cart
  function handleAddToCart() {
    if (!selectedSource) return;

    const fleetItem = selectedSource.tankerFleet.find((f) => f.capacity === selectedQuantity) || selectedSource.tankerFleet[0];
    const itemAddons = addonsList.filter((a) => selectedAddons.includes(a.id));

    const newCart = {
      sourceId: selectedSource.id,
      sourceName: selectedSource.name,
      shortName: selectedSource.shortName,
      locationName: selectedSource.locationName,
      distanceKm: selectedSource.distanceKm,
      etaMinutes: selectedSource.etaMinutes,
      quantity: selectedQuantity,
      qualityGrade: selectedQuality,
      qualityLabel: selectedSource.waterQuality.label,
      tds: selectedSource.waterQuality.tds,
      ph: selectedSource.waterQuality.ph,
      certification: selectedSource.waterQuality.certification,
      addons: itemAddons,
      deliverySlot,
      pricing: activeCustomizerPrice,
    };

    setCart(newCart);
    closeCustomizer();
    setToastMsg(`💧 Added ${selectedQuantity.toLocaleString()}L Tanker from ${selectedSource.shortName} to Cart!`);
    setTimeout(() => setToastMsg(''), 3500);
  }

  function toggleAddon(addonId) {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  // Handle Checkout
  function openCheckout() {
    if (!isLoggedIn) {
      navigate('/citizen-login');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setOrderError('');

    if (!addressForm.streetAddress.trim() || !addressForm.contactNo.trim()) {
      setOrderError('Please provide delivery address and contact number.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        sourceId: cart.sourceId,
        quantity: cart.quantity,
        waterQualityGrade: cart.qualityGrade,
        selectedAddonIds: cart.addons.map((a) => a.id),
        deliveryAddress: addressForm,
        deliverySlot: cart.deliverySlot,
        paymentMethod,
      };

      const res = await bookWaterTanker(payload);
      setOrderConfirmed(res.booking);
      setIsCheckoutOpen(false);
      setCart(null);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err) {
      setOrderError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="zomato-tanker-page">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="zomato-toast">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setIsCartOpen(true)} className="toast-cart-btn">
            View Cart 🛒
          </button>
        </div>
      )}

      {/* Top City Bar & Breadcrumb */}
      <section className="tanker-hero-bar">
        <div className="container">
          <div className="hero-bar-inner">
            <div className="hero-bar-left">
              <span className="badge-govt">CSMC Certified Civic Delivery</span>
              <h1>💧 Book Water Tanker</h1>
              <p className="hero-bar-sub">
                Order certified potable drinking or domestic utility water tankers online.
                Freshly dispatched from verified reservoirs with live GPS tracking.
              </p>
            </div>

            <div className="hero-location-pill">
              <span className="loc-pin">📍</span>
              <div>
                <small>Delivering to</small>
                <strong>
                  {addressForm.streetAddress ? addressForm.streetAddress.slice(0, 30) : 'Chhatrapati Sambhajinagar'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Strip */}
      <div className="zomato-filter-strip">
        <div className="container filter-strip-inner">
          <div className="search-box-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search reservoirs (Jayakwadi, Harsul, Salim Ali), potable RO, capacity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="zomato-search-input"
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-chips-list">
            <button
              type="button"
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Reservoirs
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === 'potable' ? 'active' : ''}`}
              onClick={() => setActiveFilter('potable')}
            >
              🌟 Potable Drinking (TDS &lt; 120)
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === 'top_rated' ? 'active' : ''}`}
              onClick={() => setActiveFilter('top_rated')}
            >
              🏆 Top Rated (4.8+ ★)
            </button>

          </div>
        </div>
      </div>

      {/* Reservoirs / Water Stations Listing */}
      <div className="container tanker-listings-section">
        <div className="listings-header">
          <div>
            <h2>Verified Water Bodies &amp; Supply Hubs</h2>

          </div>
        </div>

        <div className="zomato-cards-grid">
          {filteredSources.map((source) => (
            <div key={source.id} className="zomato-card">
              <div className="card-media-wrap">
                <img src={source.imageUrl} alt={source.name} className="card-img" />
                <span className="card-badge">{source.badge}</span>
                <div className="card-eta-pill">
                  ⏱️ <strong>{source.etaMinutes} mins</strong> ({source.distanceKm} km)
                </div>
              </div>

              <div className="card-body">
                <div className="card-top-row">
                  <h3 className="card-title">{source.name}</h3>
                  <div className="rating-badge">
                    <span>{source.rating}</span>
                    <span className="star-icon">★</span>
                  </div>
                </div>

                <p className="card-location">📍 {source.locationName}</p>

                {/* Quality Metrics Box */}
                <div className="card-metrics-box">
                  <div className="metric-chip">
                    <small>Water TDS</small>
                    <strong>{source.waterQuality.tds} ppm</strong>
                  </div>
                  <div className="metric-chip">
                    <small>pH Balance</small>
                    <strong>{source.waterQuality.ph}</strong>
                  </div>
                  <div className="metric-chip cert-chip">
                    <small>Certification</small>
                    <strong>{source.waterQuality.certification.split(' ')[0]} Verified</strong>
                  </div>
                </div>

                <div className="card-capacity-pills">
                  {source.tankerFleet.map((f) => (
                    <span key={f.capacity} className="fleet-pill">
                      {f.capacity.toLocaleString()}L: ₹{f.price}
                    </span>
                  ))}
                </div>

                <div className="card-footer">
                  <div className="card-price-start">
                    <small>Starting from</small>
                    <strong>₹{source.tankerFleet[0].price}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-zomato-add"
                    onClick={() => openCustomizer(source)}
                  >
                    Select &amp; Customize ▾
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Cart Bar (Zomato Style) */}
      {cart && !isCartOpen && !isCheckoutOpen && !orderConfirmed && (
        <div className="floating-cart-bar">
          <div className="container floating-cart-inner">
            <div className="cart-bar-info">
              <span className="cart-badge-icon">💧</span>
              <div>
                <strong>
                  {cart.quantity.toLocaleString()}L Tanker from {cart.shortName}
                </strong>
                <small>Total: ₹{cart.pricing.total} (Incl. taxes &amp; delivery)</small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-cart-view"
              onClick={() => setIsCartOpen(true)}
            >
              View Cart 🛒
            </button>
          </div>
        </div>
      )}

      {/* Customizer Modal (Zomato Dish Customizer) */}
      {selectedSource && (
        <div className="modal-backdrop" onClick={closeCustomizer}>
          <div className="customizer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="source-tag">{selectedSource.type}</span>
                <h2>{selectedSource.name}</h2>
                <p className="modal-subtitle">
                  📍 {selectedSource.locationName} • ⏱️ {selectedSource.etaMinutes} mins delivery
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeCustomizer}>
                ✕
              </button>
            </div>

            <div className="modal-scroll-content">
              {/* Step 1: Select Quantity */}
              <div className="customizer-section">
                <div className="section-title-row">
                  <label className="section-title">1. Select Water Quantity</label>
                  <span className="section-req-pill">Required</span>
                </div>
                <div className="quantity-grid">
                  {selectedSource.tankerFleet.map((fleet) => {
                    const isSelected = selectedQuantity === fleet.capacity;
                    return (
                      <button
                        key={fleet.capacity}
                        type="button"
                        className={`quantity-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedQuantity(fleet.capacity)}
                      >
                        <div className="qty-visual">
                          <span className="qty-icon">🚛</span>
                          {fleet.capacity === 5000 && <span className="popular-badge">Popular</span>}
                        </div>
                        <div className="qty-capacity">{fleet.capacity.toLocaleString()} Litres</div>
                        <div className="qty-type">{fleet.type}</div>
                        <div className="qty-price">₹{fleet.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Quality Tier */}
              <div className="customizer-section">
                <div className="section-title-row">
                  <label className="section-title">2. Water Quality Grade</label>
                  <span className="section-req-pill">Tested Daily</span>
                </div>
                <div className="quality-radio-list">
                  <label className={`quality-option-card ${selectedQuality === 'potable_ro' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="qualityGrade"
                      checked={selectedQuality === 'potable_ro'}
                      onChange={() => setSelectedQuality('potable_ro')}
                    />
                    <div className="quality-text">
                      <strong>🌟 Potable RO + UV Purified (Drinking Grade)</strong>
                      <p>Multi-stage treated, TDS: {selectedSource.waterQuality.tds} ppm, pH: {selectedSource.waterQuality.ph}. BIS 10500 certified.</p>
                    </div>
                  </label>

                  <label className={`quality-option-card ${selectedQuality === 'domestic_utility' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="qualityGrade"
                      checked={selectedQuality === 'domestic_utility'}
                      onChange={() => setSelectedQuality('domestic_utility')}
                    />
                    <div className="quality-text">
                      <strong>💧 Domestic Filtered Utility</strong>
                      <p>Ideal for household chores, overhead tank refills, cooking, bathing and laundry.</p>
                    </div>
                  </label>

                  <label className={`quality-option-card ${selectedQuality === 'construction_raw' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="qualityGrade"
                      checked={selectedQuality === 'construction_raw'}
                      onChange={() => setSelectedQuality('construction_raw')}
                    />
                    <div className="quality-text">
                      <strong>🏗️ Construction &amp; Industrial Bulk Raw</strong>
                      <p>High-volume water for curing, landscaping, road works and industrial processing.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Add-ons & Equipment */}
              <div className="customizer-section">
                <div className="section-title-row">
                  <label className="section-title">3. Equipment &amp; Priority Add-ons</label>
                  <span className="section-optional-pill">Optional</span>
                </div>
                <div className="addons-list">
                  {addonsList.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <label key={addon.id} className={`addon-item ${isChecked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                        />
                        <div className="addon-info">
                          <strong>{addon.name}</strong>
                          <p>{addon.description}</p>
                        </div>
                        <span className="addon-price">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Delivery Timing */}
              <div className="customizer-section">
                <div className="section-title-row">
                  <label className="section-title">4. Delivery Time Slot</label>
                </div>
                <div className="slots-row">
                  <button
                    type="button"
                    className={`slot-chip ${deliverySlot.includes('Immediate') ? 'active' : ''}`}
                    onClick={() => setDeliverySlot('Immediate (25-35 mins)')}
                  >
                    ⚡ Immediate (25-35 mins)
                  </button>
                  <button
                    type="button"
                    className={`slot-chip ${deliverySlot.includes('Today Evening') ? 'active' : ''}`}
                    onClick={() => setDeliverySlot('Today Evening (05:00 PM - 07:00 PM)')}
                  >
                    🌅 Today Evening (05:00 - 07:00 PM)
                  </button>
                  <button
                    type="button"
                    className={`slot-chip ${deliverySlot.includes('Tomorrow') ? 'active' : ''}`}
                    onClick={() => setDeliverySlot('Tomorrow Morning (07:00 AM - 09:00 AM)')}
                  >
                    ☀️ Tomorrow Morning (07:00 - 09:00 AM)
                  </button>
                </div>
              </div>
            </div>

            {/* Customizer Bottom Bar */}
            <div className="modal-footer">
              <div className="modal-price-breakup">
                <small>Total Payable</small>
                <div className="footer-total">₹{activeCustomizerPrice.total}</div>
                <span className="tax-subtext">(Includes ₹{activeCustomizerPrice.delivery} delivery &amp; GST)</span>
              </div>
              <button
                type="button"
                className="btn btn-primary add-to-cart-btn"
                onClick={handleAddToCart}
              >
                Add to Cart • ₹{activeCustomizerPrice.total}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer (Zomato Style) */}
      {isCartOpen && cart && (
        <div className="modal-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Your Water Cart 🛒</h2>
              <button type="button" className="drawer-close-btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="cart-item-card">
                <div className="cart-item-top">
                  <div>
                    <h3>{cart.quantity.toLocaleString()} Litres Water Tanker</h3>
                    <p className="cart-item-source">Source: <strong>{cart.sourceName}</strong></p>
                  </div>
                  <span className="cart-item-price">₹{cart.pricing.base}</span>
                </div>

                <div className="cart-item-specs">
                  <span className="spec-badge">Grade: {cart.qualityLabel}</span>
                  <span className="spec-badge">TDS: {cart.tds} ppm</span>
                  <span className="spec-badge">Slot: {cart.deliverySlot}</span>
                </div>

                {cart.addons.length > 0 && (
                  <div className="cart-addons-section">
                    <small>Selected Addons:</small>
                    <ul>
                      {cart.addons.map((a) => (
                        <li key={a.id}>
                          <span>{a.name}</span>
                          <strong>+₹{a.price}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Delivery Address Preview */}
              <div className="cart-address-box">
                <div className="address-box-header">
                  <strong>📍 Delivery Address</strong>
                  <button type="button" className="link-btn" onClick={openCheckout}>
                    Edit Address
                  </button>
                </div>
                <p>
                  {addressForm.fullName} ({addressForm.contactNo || 'Mobile not provided'})
                </p>
                <p className="address-subtext">
                  {addressForm.streetAddress || 'Click Proceed to enter street address'}
                </p>
              </div>

              {/* Bill Details */}
              <div className="cart-bill-details">
                <h4>Bill Details</h4>
                <div className="bill-row">
                  <span>Tanker Base Price ({cart.quantity.toLocaleString()}L)</span>
                  <span>₹{cart.pricing.base}</span>
                </div>
                {cart.pricing.addons > 0 && (
                  <div className="bill-row">
                    <span>Add-ons &amp; Hose Extension</span>
                    <span>₹{cart.pricing.addons}</span>
                  </div>
                )}
                <div className="bill-row">
                  <span>Delivery &amp; Fleet Logistics ({cart.distanceKm} km)</span>
                  <span>₹{cart.pricing.delivery}</span>
                </div>
                <div className="bill-row">
                  <span>Municipal Portal Fee</span>
                  <span>₹{cart.pricing.service}</span>
                </div>
                <div className="bill-row">
                  <span>Govt. Water Cess &amp; GST (5%)</span>
                  <span>₹{cart.pricing.tax}</span>
                </div>
                <div className="bill-total-row">
                  <strong>To Pay</strong>
                  <strong>₹{cart.pricing.total}</strong>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-primary checkout-action-btn" onClick={openCheckout}>
                Proceed to Checkout • ₹{cart.pricing.total} &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & Payment Modal (Cash / UPI) */}
      {isCheckoutOpen && cart && (
        <div className="modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select Address &amp; Payment</h2>
                <p className="modal-subtitle">Total Amount: ₹{cart.pricing.total}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsCheckoutOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="checkout-form">
              <div className="checkout-scroll-body">
                {orderError && <div className="checkout-error-banner">{orderError}</div>}

                {/* Section A: Delivery Address */}
                <div className="checkout-section">
                  <h3>1. Delivery Address</h3>
                  <div className="checkout-grid">
                    <label className="checkout-field">
                      <span>Full Name *</span>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      />
                    </label>

                    <label className="checkout-field">
                      <span>Contact Mobile *</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile"
                        value={addressForm.contactNo}
                        onChange={(e) => setAddressForm({ ...addressForm, contactNo: e.target.value.replace(/\D/g, '') })}
                      />
                    </label>

                    <label className="checkout-field field-full">
                      <span>Street Address / Building / House No. *</span>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. Flat 302, Sai Residency, Station Road"
                        value={addressForm.streetAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                      />
                    </label>

                    <label className="checkout-field">
                      <span>Landmark</span>
                      <input
                        type="text"
                        placeholder="Near Cannaught Place"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                      />
                    </label>

                    <label className="checkout-field">
                      <span>Ward / Zone</span>
                      <select
                        value={addressForm.ward}
                        onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                      >
                        <option value="Ward 1 - Old City">Ward 1 - Old City &amp; City Chowk</option>
                        <option value="Ward 2 - Osmanpura">Ward 2 - Osmanpura / Station Rd</option>
                        <option value="Ward 3 - Garkheda">Ward 3 - Garkheda / Sutgirni</option>
                        <option value="Ward 4 - CIDCO">Ward 4 - CIDCO (N1 - N12)</option>
                        <option value="Ward 5 - Harsul">Ward 5 - Harsul / North Zone</option>
                        <option value="Ward 6 - Waluj">Ward 6 - Waluj / MIDC Area</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Section B: Payment Methods (Cash / UPI) */}
                <div className="checkout-section">
                  <h3>2. Select Payment Method</h3>
                  <div className="payment-options-grid">
                    {/* UPI Option */}
                    <div
                      className={`payment-option-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <div className="pay-card-header">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                        />
                        <strong>⚡ UPI (Instant Online Payment)</strong>
                      </div>
                      <p className="pay-card-desc">
                        Pay using GPay, PhonePe, Paytm, BHIM, or Scan QR Code.
                      </p>

                      {paymentMethod === 'upi' && (
                        <div className="upi-details-box">
                          <div className="upi-qr-card">
                            <div className="mock-qr-code">
                              <span className="qr-sim">📱 [MOCK UPI QR CODE]</span>
                              <small>Scan with any UPI App</small>
                            </div>
                            <div className="upi-or-divider">OR</div>
                            <div className="upi-id-input-wrap">
                              <input
                                type="text"
                                placeholder="Enter UPI ID (e.g. yourname@okhdfcbank)"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="upi-input"
                              />
                            </div>
                          </div>
                          <span className="upi-secure-badge">🔒 256-bit Encrypted CSMC Municipal Gateway</span>
                        </div>
                      )}
                    </div>

                    {/* Cash on Delivery Option */}
                    <div
                      className={`payment-option-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <div className="pay-card-header">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                        />
                        <strong>💵 Cash on Delivery (COD)</strong>
                      </div>
                      <p className="pay-card-desc">
                        Pay cash directly to the tanker driver upon arrival and water dispensing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-price-breakup">
                  <small>Total to Pay</small>
                  <div className="footer-total">₹{cart.pricing.total}</div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary place-order-btn"
                  disabled={submittingOrder}
                >
                  {submittingOrder
                    ? 'Confirming Booking...'
                    : paymentMethod === 'upi'
                      ? `Pay ₹${cart.pricing.total} via UPI & Confirm`
                      : `Place Order (Cash on Delivery)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmed Screen */}
      {orderConfirmed && (
        <div className="modal-backdrop">
          <div className="order-confirmed-modal">
            <div className="confetti-icon">🎉</div>
            <span className="confirmed-badge">Order Confirmed</span>
            <h2>Water Tanker Booked Successfully!</h2>
            <p className="confirmed-booking-id">
              Booking Ref: <strong>{orderConfirmed.bookingId}</strong>
            </p>

            <div className="confirmed-details-card">
              <div className="detail-line">
                <span>Quantity:</span>
                <strong>{orderConfirmed.quantity?.toLocaleString()} Litres</strong>
              </div>
              <div className="detail-line">
                <span>Source:</span>
                <strong>{orderConfirmed.waterSource?.name}</strong>
              </div>
              <div className="detail-line">
                <span>Assigned Tanker:</span>
                <strong>{orderConfirmed.driver?.vehicleNo} ({orderConfirmed.driver?.name})</strong>
              </div>
              <div className="detail-line">
                <span>ETA:</span>
                <strong>Arriving in {orderConfirmed.tracking?.etaMinutes || 25} mins</strong>
              </div>
              <div className="detail-line">
                <span>Payment:</span>
                <span className="status-pill status-resolved">
                  {orderConfirmed.payment?.method?.toUpperCase()} (₹{orderConfirmed.pricing?.totalAmount})
                </span>
              </div>
            </div>

            <div className="confirmed-actions">
              <Link
                to={`/track-tanker/${orderConfirmed.bookingId}`}
                className="btn btn-primary track-live-btn"
              >
                🚀 Track Tanker Live (Zomato-Style GPS)
              </Link>
              <Link to="/dashboard" className="btn btn-outline">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
