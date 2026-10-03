import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView, { STATUS_COLORS } from '../components/MapView.jsx';
import AdminStats from '../components/AdminStats.jsx';
import { fetchComplaintMap, fetchPublicStats } from '../services/public/index.js';
import './CityInsights.css';

// Held/rejected complaints are never published, so they have no legend entry.
const PUBLIC_STATUSES = Object.keys(STATUS_COLORS).filter((s) => s !== 'Suspected Fake' && s !== 'Rejected');

function InsightsPage({ title, intro, other, children }) {
  return (
    <section className="section city-insights">
      <div className="container">
        <header className="ci-head">
          <div>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
          <Link to={other.to} className="btn btn-outline">{other.label}</Link>
        </header>
        {children}
      </div>
    </section>
  );
}

/** Public complaint-status map, the same view officers/admins use, built only from portal records. */
export function LiveHeatmap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchComplaintMap()
      .then((res) => !cancelled && setItems(res.items || []))
      .catch((err) => !cancelled && setError(err.message || 'Could not load the map.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo(
    () =>
      items
        .filter((c) => Array.isArray(c.location?.coordinates))
        .map((c) => ({
          lat: c.location.coordinates[1],
          lng: c.location.coordinates[0],
          status: c.status,
          label: `${c.categoryLabel} · ${c.status}`,
        })),
    [items]
  );

  const counts = useMemo(
    () => markers.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {}),
    [markers]
  );

  return (
    <InsightsPage
      title="Live Complaint Heatmap"
      intro="Every verified complaint raised on the portal, coloured by its current status."
      other={{ to: '/city-analytics', label: 'View analytics' }}
    >
      <ul className="ci-legend" aria-label="Status legend">
        {PUBLIC_STATUSES.map((s) => (
          <li key={s}>
            <span className="ci-dot" style={{ background: STATUS_COLORS[s] }} aria-hidden="true" />
            {s} <strong>{counts[s] || 0}</strong>
          </li>
        ))}
      </ul>
      {error && <p className="ci-error" role="alert">{error}</p>}
      <MapView markers={markers} height={520} />
      {!loading && !error && markers.length === 0 && <p className="ci-empty">No complaints have been mapped yet.</p>}
    </InsightsPage>
  );
}

/** Public analytics: the admin overview fed by the login-free stats endpoint (live portal counts only). */
export function CityAnalytics() {
  return (
    <InsightsPage
      title="City Analytical Dashboard"
      intro="Live counts of complaints and service bookings made through the portal."
      other={{ to: '/live-heatmap', label: 'View heatmap' }}
    >
      <AdminStats loadStats={fetchPublicStats} />
    </InsightsPage>
  );
}
