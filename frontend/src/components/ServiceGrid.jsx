import React from 'react';
import { Link } from 'react-router-dom';
import './ServiceGrid.css';

const ICONS = {
  city: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 20V9l5-3v14M13 20V4l7 4v12" strokeLinejoin="round" />
      <path d="M4 20h16M7 12h1M7 16h1M17 11h1M17 15h1" strokeLinecap="round" />
    </svg>
  ),
  issue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3l9 16H3l9-16z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  track: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 12a8 8 0 1 1 8 8" strokeLinecap="round" />
      <path d="M4 12v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  water: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" strokeLinejoin="round" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="13" width="5" height="8" rx="1" />
      <rect x="10" y="8" width="5" height="13" rx="1" />
      <rect x="17" y="3" width="5" height="18" rx="1" />
    </svg>
  ),
  updates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  heatmap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

const SERVICES = [
  {
    icon: 'city',
    title: 'Know Your City',
    desc: 'Ward maps, zonal offices, and city facilities at a glance.',
    to: '/know-your-city',
  },
  {
    icon: 'issue',
    title: 'Register a Complaint',
    desc: 'Report potholes, garbage, streetlights, drainage and more.',
    to: '/register-complaint',
  },
  {
    icon: 'track',
    title: 'Track Your Complaint',
    desc: 'Check live status of a complaint using your reference number.',
    to: '/track-complaint',
  },
  {
    icon: 'water',
    title: 'Water Request',
    desc: 'Request a tanker, report a leak, or check supply timings.',
    to: '/water-request',
  },
  {
    icon: 'dashboard',
    title: 'City Analytical Dashboard',
    desc: 'Live complaint metrics, resolution speeds, and ward statistics.',
    to: '/dashboard',
  },
  {
    icon: 'updates',
    title: 'Daily Updates',
    desc: 'Water supply schedules, road works, and power shutdown alerts.',
    to: '/daily-updates',
  },
  {
    icon: 'heatmap',
    title: 'Live Heatmap',
    desc: 'Identify hotspot areas.',
    to: '/live-heatmap',
  },
];

export default function ServiceGrid() {
  return (
    <section className="section services" id="services" aria-labelledby="services-heading">
      <div className="container">
        <div className="section-heading">
          <h2 id="services-heading">Every service, one place</h2>
          <p>Pick what you need.</p>
        </div>

        <ul className="service-grid">
          {SERVICES.map((s) => (
            <li key={s.to}>
              <Link to={s.to} className="service-card">
                <span className="service-icon">{ICONS[s.icon]}</span>
                <span className="service-title">{s.title}</span>
                <p className="service-desc">{s.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
