import React, { useEffect, useState } from 'react';
import { fetchAdminStats } from '../services/admin/index.js';
import './AdminStats.css';

const PERIODS = [
  { weeks: 1, label: 'Last 7 days' },
  { weeks: 4, label: 'Last 4 weeks' },
  { weeks: 8, label: 'Last 8 weeks' },
  { weeks: 12, label: 'Last 12 weeks' },
];

const RATINGS = [
  { value: '', label: 'All ratings' },
  ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` })),
];

const number = new Intl.NumberFormat('en-IN');
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/** Portal statistics panel. `loadStats` swaps the data source (admin API by default, public API for citizens). */
export default function AdminStats({ loadStats = fetchAdminStats }) {
  const [weeks, setWeeks] = useState(4);
  const [rating, setRating] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    loadStats({ weeks, rating })
      .then((res) => !cancelled && setStats(res))
      .catch((err) => !cancelled && setError(err.message || 'Could not load statistics.'));
    return () => {
      cancelled = true;
    };
  }, [weeks, rating, loadStats]);

  const totals = stats?.totals;
  const avg = stats?.averageRating;
  const ratedSuffix = rating ? ` (${rating}★)` : '';

  const tiles = totals && [
    { label: 'Complaints submitted', value: totals.complaintsSubmitted },
    { label: 'Pending at officers', value: totals.pendingReview },
    { label: `Resolved${ratedSuffix}`, value: totals.complaintsResolved, note: avg.complaints && `Avg rating ${avg.complaints}★` },
    { label: 'Rejected', value: totals.complaintsRejected },
    { label: 'Suspected fake', value: totals.suspectedFake },
    { label: `Water tanker bookings${ratedSuffix}`, value: totals.tankerBookings, note: avg.tanker && `Avg rating ${avg.tanker}★` },
    { label: `Garbage van bookings${ratedSuffix}`, value: totals.garbageBookings, note: avg.garbage && `Avg rating ${avg.garbage}★` },
  ];

  return (
    <section className="as-panel" aria-labelledby="as-title">
      <div className="as-head">
        <h2 id="as-title">Overview</h2>
        <div className="as-filters">
          <label>
            <span className="visually-hidden">Period</span>
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              {PERIODS.map((p) => (
                <option key={p.weeks} value={p.weeks}>{p.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Rating</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              {RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <p className="as-error" role="alert">{error}</p>}

      {tiles && (
        <>
          <div className="as-tiles">
            {tiles.map((t) => (
              <div key={t.label} className="as-tile">
                <span className="as-tile-label">{t.label}</span>
                <strong className="as-tile-value">{number.format(t.value)}</strong>
                {t.note && <span className="as-tile-note">{t.note}</span>}
              </div>
            ))}
          </div>
          {rating && (
            <p className="as-hint">
              The rating filter applies to resolved complaints and bookings; the other counts are unaffected.
            </p>
          )}

          <div className="as-table-wrap">
            <table className="as-table">
              <caption className="visually-hidden">Weekly totals</caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Complaints submitted</th>
                  <th scope="col">Resolved{ratedSuffix}</th>
                  <th scope="col">Water tanker{ratedSuffix}</th>
                  <th scope="col">Garbage van{ratedSuffix}</th>
                </tr>
              </thead>
              <tbody>
                {stats.weekly.map((w) => (
                  <tr key={w.from}>
                    <th scope="row">
                      {shortDate.format(new Date(w.from))} – {shortDate.format(new Date(w.to))}
                    </th>
                    <td>{number.format(w.complaintsSubmitted)}</td>
                    <td>{number.format(w.complaintsResolved)}</td>
                    <td>{number.format(w.tankerBookings)}</td>
                    <td>{number.format(w.garbageBookings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
