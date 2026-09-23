import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './KnowYourCity.css';

const SECTIONS = [
  {
    icon: '🏛️',
    title: 'History & Heritage',
    to: '/city-history',
    tag: 'Culture & Origins',
    desc: 'Founding by Malik Ambar in 1610, timeline of name changes, historical coordinates, welcome gate photo, and city map.',
  },
  {
    icon: '🚆',
    title: 'City Transportation',
    to: '/city-transport',
    tag: 'Transit & Timetables',
    desc: 'Timetables for Smart City bus corridors, major train connections, IXU flight schedules, and zone-wise 24/7 auto stands.',
  },
  {
    icon: '🏢',
    title: 'City Facilities',
    to: '/city-facilities',
    tag: 'Civic Amenities',
    desc: 'Public parks & gardens, civil hospitals, 180+ municipal schools, fire brigade stations, and water pumping plants.',
  },
  
];

export default function KnowYourCity() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="kyc-page">
      {/* Page header */}
      <section className="kyc-hero">
        <div className="container">
          <span className="kyc-tag">Chh. Sambhajinagar Municipal Corporation</span>
          <h1>Know Your City</h1>
          <p className="kyc-subtitle">
            Explore Chhatrapati Sambhajinagar’s heritage, transportation timetables, public facilities, and zonal governance directories.
          </p>
        </div>
      </section>

      {/* City facts bar */}
      <div className="kyc-facts-bar">
        <div className="container kyc-facts-inner">
          {[
            { value: '115+', label: 'Municipal Wards' },
            { value: '10', label: 'Zones' },
            { value: '1.6M+', label: 'Population' },
            { value: '138 km²', label: 'City Area' },
          ].map((f) => (
            <div className="kyc-fact" key={f.label}>
              <span className="kyc-fact-value">{f.value}</span>
              <span className="kyc-fact-label">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Feature Exploration Cards */}
      <section className="section kyc-portal-section">
        <div className="container">
          <div className="section-heading">
            <span className="kyc-badge-pill">City Information Hub</span>
            <h2>Explore City Directories &amp; Guides</h2>
            <p>Select any category below to access dedicated schedules, maps, and information.</p>
          </div>

          <div className="kyc-hub-grid">
            {SECTIONS.map((sec) => (
              <Link to={sec.to} key={sec.title} className="kyc-hub-card">
                <div className="kyc-hub-top">
                  <span className="kyc-hub-icon">{sec.icon}</span>
                  <span className="kyc-hub-tag">{sec.tag}</span>
                </div>
                <h3 className="kyc-hub-title">{sec.title}</h3>
                <p className="kyc-hub-desc">{sec.desc}</p>
                <div className="kyc-hub-cta">
                  <span>Explore {sec.title}</span>
                  <span className="kyc-hub-arrow">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
