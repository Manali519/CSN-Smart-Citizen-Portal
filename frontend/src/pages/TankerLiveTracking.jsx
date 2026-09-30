import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchTankerTracking, updateTankerBookingStatus } from '../services/bookings/index.js';
import './TankerLiveTracking.css';

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons
function createCustomIcon(emoji, bgClass, pulse = false) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="marker-pin-wrap ${bgClass}">
        ${pulse ? '<span class="marker-pulse-ring"></span>' : ''}
        <span class="marker-emoji">${emoji}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 40],
    popupAnchor: [0, -36],
  });
}

const TANKER_TRUCK_ICON = createCustomIcon('🚛', 'pin-truck', true);
const RESERVOIR_ICON = createCustomIcon('💧', 'pin-reservoir');
const HOME_ICON = createCustomIcon('🏠', 'pin-home');

export default function TankerLiveTracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live simulation states
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [distanceKm, setDistanceKm] = useState(3.5);
  const [status, setStatus] = useState('on_the_way');

  // Modals
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Leaflet map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const traveledPolylineRef = useRef(null);

  // Load tracking data from API
  const loadTracking = useCallback(async () => {
    try {
      const res = await fetchTankerTracking(bookingId);
      if (res.tracking) {
        setBooking(res.tracking);
        setStatus(res.tracking.status || 'on_the_way');
        setEtaMinutes(res.tracking.tracking?.etaMinutes ?? 22);
        setDistanceKm(res.tracking.tracking?.distanceRemainingKm ?? 3.5);
        setStepIndex(res.tracking.tracking?.currentStepIndex || 0);
      }
    } catch (err) {
      setError(err.message || 'Unable to load live tracking for this order.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!booking || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const route = booking.tracking?.routeCoordinates || [];
    const startCoord = booking.tracking?.startLocation || { lat: 19.8350, lng: 75.3120 };
    const destCoord = booking.tracking?.destinationLocation || { lat: 19.8762, lng: 75.3433 };

    // Center map midway
    const centerLat = (startCoord.lat + destCoord.lat) / 2;
    const centerLng = (startCoord.lng + destCoord.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | CSMC Smart City GPS',
    }).addTo(map);

    // Source Reservoir Marker
    L.marker([startCoord.lat, startCoord.lng], { icon: RESERVOIR_ICON })
      .addTo(map)
      .bindPopup(`<b>${booking.waterSource?.name || 'Water Reservoir'}</b><br/>Originating Source Station`);

    // Destination Home Marker
    L.marker([destCoord.lat, destCoord.lng], { icon: HOME_ICON })
      .addTo(map)
      .bindPopup(`<b>Delivery Address</b><br/>${booking.deliveryAddress?.streetAddress || 'Your Location'}`);

    // Full Route Polyline (dashed blue)
    if (route.length > 0) {
      const latLngs = route.map((w) => [w.lat, w.lng]);
      routePolylineRef.current = L.polyline(latLngs, {
        color: '#0284C7',
        weight: 6,
        opacity: 0.5,
        dashArray: '10, 10',
      }).addTo(map);

      // Traveled Path Polyline (solid green)
      traveledPolylineRef.current = L.polyline([[startCoord.lat, startCoord.lng]], {
        color: '#16A34A',
        weight: 6,
        opacity: 0.9,
      }).addTo(map);

      // Moving Tanker Truck Marker
      const initialTruckPos = route[0] || startCoord;
      truckMarkerRef.current = L.marker([initialTruckPos.lat, initialTruckPos.lng], {
        icon: TANKER_TRUCK_ICON,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`<b>${booking.driver?.name} (Tanker)</b><br/>Vehicle: ${booking.driver?.vehicleNo}`);

      // Fit map bounds to encompass the route
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [booking]);

  // Live GPS movement simulation along waypoints
  useEffect(() => {
    if (!booking || !isPlaying) return;

    const route = booking.tracking?.routeCoordinates || [];
    if (route.length === 0) return;

    const interval = setInterval(() => {
      setStepIndex((curr) => {
        if (curr >= route.length - 1) {
          setStatus('arrived');
          setEtaMinutes(0);
          setDistanceKm(0);
          return route.length - 1;
        }

        const next = curr + 1;
        const progress = next / (route.length - 1);
        const nextLoc = route[next];

        // Update tanker marker on map
        if (truckMarkerRef.current && nextLoc) {
          truckMarkerRef.current.setLatLng([nextLoc.lat, nextLoc.lng]);
        }

        // Update traveled polyline
        if (traveledPolylineRef.current) {
          const traveledCoords = route.slice(0, next + 1).map((w) => [w.lat, w.lng]);
          traveledPolylineRef.current.setLatLngs(traveledCoords);
        }

        // Calculate dynamic ETA and distance
        const totalDist = booking.pricing?.distanceKm || 4.2;
        const remainingDist = Number(Math.max(0, totalDist * (1 - progress)).toFixed(1));
        const remainingEta = Math.max(1, Math.ceil(22 * (1 - progress)));

        setDistanceKm(remainingDist);
        setEtaMinutes(remainingEta);

        // Status transition
        if (progress > 0.88) {
          setStatus('arrived');
        } else if (progress > 0.1) {
          setStatus('on_the_way');
        }

        return next;
      });
    }, 2400); // moves every 2.4s

    return () => clearInterval(interval);
  }, [booking, isPlaying]);

  // Call duration counter
  useEffect(() => {
    let t;
    if (callActive) {
      t = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(t);
  }, [callActive]);

  // Manual fast-forward helper
  function fastForward() {
    if (!booking) return;
    const route = booking.tracking?.routeCoordinates || [];
    setStepIndex((curr) => {
      const next = Math.min(route.length - 1, curr + 4);
      if (next >= route.length - 1) {
        setStatus('arrived');
        setEtaMinutes(0);
        setDistanceKm(0);
      }
      const nextLoc = route[next];
      if (truckMarkerRef.current && nextLoc) {
        truckMarkerRef.current.setLatLng([nextLoc.lat, nextLoc.lng]);
      }
      return next;
    });
  }

  function simulateArrival() {
    if (!booking) return;
    const route = booking.tracking?.routeCoordinates || [];
    const lastIdx = route.length - 1;
    setStepIndex(lastIdx);
    setStatus('arrived');
    setEtaMinutes(0);
    setDistanceKm(0);
    const lastLoc = route[lastIdx];
    if (truckMarkerRef.current && lastLoc) {
      truckMarkerRef.current.setLatLng([lastLoc.lat, lastLoc.lng]);
    }
    if (traveledPolylineRef.current) {
      traveledPolylineRef.current.setLatLngs(route.map((w) => [w.lat, w.lng]));
    }
  }

  function handleStartCall() {
    setShowCallModal(true);
    setCallActive(true);
  }

  function handleEndCall() {
    setCallActive(false);
    setShowCallModal(false);
  }

  if (loading) {
    return (
      <div className="container section">
        <p className="loading-tracker">Connecting to GPS Satellite &amp; Tanker Telemetry&hellip;</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container section">
        <div className="tracking-error-card">
          <h2>Order Not Found or Session Expired</h2>
          <p>{error || 'Unable to locate this tanker booking.'}</p>
          <Link to="/services/water-tanker" className="btn btn-primary">
            Back to Water Tanker Services
          </Link>
        </div>
      </div>
    );
  }

  const driver = booking.driver || {
    name: 'Ramesh Patil',
    phone: '+91 98230 45678',
    vehicleNo: 'MH-20-CZ-4412',
    vehicleModel: 'Tata LPK 10000L Stainless Tanker',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  };

  const statusLabel =
    status === 'arrived'
      ? 'Tanker Arrived at Your Gate 🏁'
      : status === 'filling'
      ? 'Filling Water & Testing Purity 💧'
      : status === 'completed'
      ? 'Water Transfer Completed ✅'
      : 'Tanker Dispatched & On the Way 🚚';

  return (
    <div className="live-tracking-page">
      {/* Top Banner */}
      <div className="tracking-top-strip">
        <div className="container top-strip-inner">
          <div className="order-pill">
            <span className="live-pulsing-dot"></span>
            <strong>Order #{booking.bookingId}</strong>
            <span className="pill-divider">•</span>
            <span>{booking.quantity?.toLocaleString()}L Potable Water</span>
          </div>

          <div className="top-strip-actions">
            <button
              type="button"
              className="btn btn-cert-pill"
              onClick={() => setShowCertModal(true)}
            >
              🧪 View Purity Lab Certificate
            </button>
            <Link to="/dashboard" className="link-back-dash">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Tracking View */}
      <div className="container tracking-main-grid">
        {/* Left Column: Live Map */}
        <div className="map-column">
          <div className="map-wrapper-card">
            {/* Live Telemetry Floating Bar over Map */}
            <div className="map-overlay-telemetry">
              <div className="telemetry-box">
                <small>Estimated Arrival</small>
                <strong>
                  {status === 'arrived' ? 'At Your Gate!' : `${etaMinutes} mins`}
                </strong>
              </div>
              <div className="telemetry-box">
                <small>Distance</small>
                <strong>
                  {status === 'arrived' ? '0.0 km' : `${distanceKm} km away`}
                </strong>
              </div>
              <div className="telemetry-box">
                <small>Current Speed</small>
                <strong>{status === 'arrived' ? '0 km/h' : '34 km/h'}</strong>
              </div>
            </div>

            {/* Leaflet Map Div */}
            <div id="live-map-container" ref={mapContainerRef} className="live-map-canvas" />

            {/* Simulation Controller Bar */}
            <div className="sim-controller-bar">
              <span className="sim-label">⚡ GPS Simulator:</span>
              <button
                type="button"
                className="sim-btn"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? '⏸️ Pause Telemetry' : '▶️ Resume Live GPS'}
              </button>
              <button type="button" className="sim-btn" onClick={fastForward}>
                ⏩ Step Ahead
              </button>
              <button type="button" className="sim-btn sim-btn-arrive" onClick={simulateArrival}>
                🏁 Arrive at Gate
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Driver & Status Timeline (Zomato Style) */}
        <div className="details-column">
          {/* Driver Card */}
          <div className="zomato-driver-card">
            <div className="driver-top-row">
              <img src={driver.photo} alt={driver.name} className="driver-avatar" />
              <div className="driver-details">
                <span className="assigned-tag">Your Water Delivery Partner</span>
                <h3>{driver.name}</h3>
                <div className="driver-subline">
                  <span className="driver-rating">★ {driver.rating}</span>
                  <span className="driver-trips">1,420+ safe deliveries</span>
                </div>
              </div>
            </div>

            <div className="driver-vehicle-box">
              <div className="vehicle-line">
                <span>Vehicle Plate:</span>
                <strong>{driver.vehicleNo}</strong>
              </div>
              <div className="vehicle-line">
                <span>Tanker Model:</span>
                <strong>{driver.vehicleModel}</strong>
              </div>
            </div>

            <div className="driver-actions-row">
              <button
                type="button"
                className="btn btn-call-driver"
                onClick={handleStartCall}
              >
                📞 Call Driver
              </button>
              <button
                type="button"
                className="btn btn-instructions"
                onClick={() => alert(`Delivery Notes: Leave gate open for booster pipe insertion.`)}
              >
                💬 Delivery Notes
              </button>
            </div>
          </div>

          {/* Live Order Stepper */}
          <div className="zomato-status-card">
            <div className="status-card-header">
              <h2>Delivery Status</h2>
              <span className="live-status-pill">{statusLabel}</span>
            </div>

            <div className="order-stepper">
              <div className="step-item completed">
                <div className="step-indicator">✓</div>
                <div className="step-text">
                  <strong>Order Placed &amp; Tanker Assigned</strong>
                  <p>Tanker {driver.vehicleNo} assigned from {booking.waterSource?.name}</p>
                </div>
              </div>

              <div className={`step-item ${status !== 'confirmed' ? 'completed' : 'active'}`}>
                <div className="step-indicator">{status !== 'confirmed' ? '✓' : '💧'}</div>
                <div className="step-text">
                  <strong>Filling &amp; Digital Purity Testing</strong>
                  <p>
                    {booking.quantity?.toLocaleString()}L pumped at reservoir. TDS: {booking.waterQuality?.tds} ppm verified safe.
                  </p>
                </div>
              </div>

              <div className={`step-item ${status === 'arrived' ? 'completed' : 'active'}`}>
                <div className="step-indicator">{status === 'arrived' ? '✓' : '🚚'}</div>
                <div className="step-text">
                  <strong>On the Way to Your Location</strong>
                  <p>Driver is following fastest civic route. Live GPS beacon active.</p>
                </div>
              </div>

              <div className={`step-item ${status === 'arrived' ? 'active' : ''}`}>
                <div className="step-indicator">🏁</div>
                <div className="step-text">
                  <strong>Arrived at Gate &amp; Water Dispensing</strong>
                  <p>Connect booster hose and transfer water into overhead/underground sump.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Purity Info Card */}
          <div className="delivery-specs-card">
            <h4>Delivery Location &amp; Specs</h4>
            <p className="specs-address">
              📍 <strong>{booking.deliveryAddress?.fullName}</strong> — {booking.deliveryAddress?.streetAddress}, {booking.deliveryAddress?.ward}
            </p>
            <div className="specs-grid">
              <div>
                <small>Water Body</small>
                <strong>{booking.waterSource?.name}</strong>
              </div>
              <div>
                <small>Quality Tier</small>
                <strong>{booking.waterQuality?.label}</strong>
              </div>
              <div>
                <small>Quantity</small>
                <strong>{booking.quantity?.toLocaleString()} Litres</strong>
              </div>
              <div>
                <small>Payment Mode</small>
                <strong>{booking.payment?.method?.toUpperCase()} (₹{booking.pricing?.totalAmount})</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Phone Call Modal */}
      {showCallModal && (
        <div className="modal-backdrop" onClick={handleEndCall}>
          <div className="call-simulator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calling-avatar-ring">
              <img src={driver.photo} alt={driver.name} className="calling-avatar" />
            </div>
            <h3>Calling {driver.name}&hellip;</h3>
            <p className="calling-vehicle">{driver.vehicleNo} (Water Tanker Pilot)</p>
            <div className="call-timer">
              {Math.floor(callDuration / 60)}:
              {String(callDuration % 60).padStart(2, '0')}
            </div>
            <p className="call-sim-note">
              &ldquo;Namaskar! I am 1.5 km away near the signal. Please keep the main gate open for the tanker.&rdquo;
            </p>
            <button type="button" className="btn btn-hangup" onClick={handleEndCall}>
              ❌ End Call
            </button>
          </div>
        </div>
      )}

      {/* Purity Certificate Modal */}
      {showCertModal && (
        <div className="modal-backdrop" onClick={() => setShowCertModal(false)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-header">
              <span className="cert-emblem">🏛️</span>
              <div>
                <h3>Chhatrapati Sambhajinagar Municipal Corporation</h3>
                <small>Central Water Testing &amp; Hydrological Laboratory</small>
              </div>
            </div>

            <div className="cert-body">
              <div className="cert-stamp">VERIFIED PASS</div>
              <h4>Certificate of Water Quality &amp; Potability</h4>
              <p>Batch Reference: <strong>CSMC-WTR-2026-9812</strong></p>

              <table className="cert-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Measured Value</th>
                    <th>BIS 10500 Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Dissolved Solids (TDS)</td>
                    <td>{booking.waterQuality?.tds || 92} ppm</td>
                    <td>&lt; 500 ppm</td>
                    <td className="pass-text">PASS</td>
                  </tr>
                  <tr>
                    <td>pH Level</td>
                    <td>{booking.waterQuality?.ph || 7.2}</td>
                    <td>6.5 - 8.5</td>
                    <td className="pass-text">PASS</td>
                  </tr>
                  <tr>
                    <td>Residual Chlorine</td>
                    <td>0.2 ppm</td>
                    <td>0.2 - 0.5 ppm</td>
                    <td className="pass-text">PASS</td>
                  </tr>
                  <tr>
                    <td>Microbiological Coliform</td>
                    <td>0 CFU / 100ml</td>
                    <td>0 CFU</td>
                    <td className="pass-text">STERILE</td>
                  </tr>
                </tbody>
              </table>

              <p className="cert-footer-text">
                Certified suitable for drinking, cooking and domestic consumption.
                Tested on automated spectrophotometer at {booking.waterSource?.name}.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCertModal(false)}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
