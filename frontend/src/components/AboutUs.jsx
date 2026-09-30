import React from 'react';
import './AboutUs.css';

const STATS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V9l5-3v14M13 20V4l7 4v12" strokeLinejoin="round" />
        <path d="M4 20h16" strokeLinecap="round" />
      </svg>
    ),
    value: '115+',
    label: 'Municipal Wards',
    desc: 'Covering 10 zones across the city',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    value: 'City-Wide',
    label: 'Citizens Served',
    desc: 'Empowered through digital governance',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    value: '24/7',
    label: 'Portal Access',
    desc: 'Instant lodging and tracking',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    value: '10+',
    label: 'City Services',
    desc: 'Water, roads, sanitation, hospitals & more',
  },
];

export default function AboutUs() {
  return (
    <section id="about" className="section about" aria-labelledby="about-heading">
      <div className="container">
        <div className="about-grid">
          {/* Left: text */}
          <div className="about-text">
            <span className="about-tag">About the Portal</span>
            <h2 id="about-heading">Built for the citizens of Chhatrapati Sambhajinagar</h2>
            <p>
              The Chhatrapati Sambhajinagar Smart City Portal is an initiative by the
              Chhatrapati Sambhajinagar Municipal Corporation (CSMC) to bring all civic
              services online — fast, transparent, and accessible.
            </p>
            <p>
              Whether you need to report a broken streetlight, track a water tanker request,
              or find your ward office, this portal connects you directly to the right
              department without any queues or paperwork.
            </p>
            <ul className="about-highlights">
              <li>
                <span className="highlight-dot" />
                Paperless complaint registration and tracking
              </li>
              <li>
                <span className="highlight-dot" />
                Real-time status updates via your account dashboard
              </li>
              <li>
                <span className="highlight-dot" />
                Zone level information for all 10 zones
              </li>
              <li>
                <span className="highlight-dot" />
                Dedicated officer portal for transparent resolution
              </li>
            </ul>
          </div>

          {/* Right: stats matching Know Your City cards */}
          <div className="about-stats">
            {STATS.map((s) => (
              <div className="about-card" key={s.label}>
                <div className="about-card-icon">{s.icon}</div>
                <span className="about-card-value">{s.value}</span>
                <span className="about-card-title">{s.label}</span>
                <p className="about-card-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
