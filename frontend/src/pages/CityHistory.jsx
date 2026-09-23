import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CityHistory.css';



const HERITAGE_SITES = [
  {
    name: 'Kailasa Temple & Ellora Caves',
    status: 'UNESCO World Heritage Site',
    statusType: 'unesco',
    img: '/assets/ellora-caves.jpg',
    desc: 'World-famous 34 rock-cut caves carved between the 6th and 10th century CE across Buddhist, Hindu, and Jain traditions. Cave 16 (Kailasa Temple) is the largest monolithic rock excavation on Earth, carved top-down from a single volcanic basalt cliff.',
    highlights: 'Monolithic architecture, 34 rock-cut cave temples, 30 km from city center',
  },
  {
    name: 'Bibi Ka Maqbara ("Taj of the Deccan")',
    status: 'National Monument (ASI)',
    statusType: 'asi',
    img: '/assets/bibi-ka-maqbara.jpg',
    desc: 'Built in 1668 by Mughal Prince Azam Shah in memory of his mother Dilras Banu Begum. Featuring striking white marble domes, four towering minarets, and geometric Mughal charbagh gardens with reflection pools.',
    highlights: 'Mughal charbagh architecture, marble filigree work, located within city limits',
  },
  {
    name: 'Daulatabad Fort (Devagiri)',
    status: '12th-Century Hill Fortress',
    statusType: 'fort',
    img: '/assets/daulatabad-fort.jpg',
    desc: 'Impregnable medieval hill fortress built by the Yadava dynasty and later chosen by Muhammad bin Tughlaq as India’s capital. Famous for its steep 50-meter rock-cut moat, the iconic Chand Minar, and subterranean defensive maze (Andhari).',
    highlights: 'Chand Minar tower, subterranean maze, 360° panoramic Marathwada views',
  },
  {
    name: '52 Historical Gates ("City of Gates")',
    status: 'Living Medieval Heritage',
    statusType: 'gate',
    img: '/assets/csn-welcome.jpg',
    desc: 'Historically guarded by 52 grand entrance arches earning the moniker "City of Gates". Iconic surviving gates include Delhi Gate, Paithan Gate, Bhadkal Gate (built in 1612 to commemorate victory over Mughals), and Roshan Gate.',
    highlights: 'Bhadkal Gate, Delhi Gate, Paithan Gate, historic water supply aqueducts (Neher)',
  },
];

export default function CityHistory() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="history-page">
      {/* Hero Header */}
      <section className="history-hero">
        <div className="container">
          <div className="history-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/know-your-city">Know Your City</Link>
            <span>/</span>
            <span>History &amp; Heritage</span>
          </div>
          <span className="history-tag">Tourism Capital of Maharashtra</span>
          <h1>Chhatrapati Sambhajinagar</h1>
          <p className="history-subtitle">
            The City of Gates &mdash; Gateway to UNESCO World Heritage Sites, a treasure of 400+ years of history, and India’s booming Smart Industrial Powerhouse.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container history-container">
        {/* Quick City Snapshot Facts */}
        <section className="history-section">
          <div className="history-facts-grid">
            <div className="history-fact-card">
              <span className="hfact-icon">📍</span>
              <span className="hfact-label">Geographic Location</span>
              <strong>Marathwada Region, Maharashtra</strong>
              <p>Deccan Plateau, along the Kham River basin &middot; 568 m elevation</p>
            </div>
            <div className="history-fact-card">
              <span className="hfact-icon">🌐</span>
              <span className="hfact-label">Coordinates</span>
              <strong>19.88° N, 75.32° E</strong>
              <p>Central Maharashtra connectivity with Pune, Mumbai, Jalna &amp; Nashik</p>
            </div>
           
            <div className="history-fact-card">
              <span className="hfact-icon">☀️</span>
              <span className="hfact-label">Climate Profile</span>
              <strong>Hot Semi-Arid</strong>
              <p>Pleasant mild winters (10–28°C), monsoon Jun–Sep, summer Mar–Jun</p>
            </div>
          </div>
        </section>

        

        {/* Famous Historical Sites with Images */}
        <section className="history-section">
          <div className="history-section-header">
            <span className="hsec-pill">World Heritage &amp; Monuments</span>
            <h2>Famous Historical &amp; Heritage Sites</h2>
            <p>World-renowned architecture attracting millions of global travellers and historians.</p>
          </div>

          <div className="heritage-cards-grid">
            {HERITAGE_SITES.map((site) => (
              <div className="heritage-card" key={site.name}>
                <div className="heritage-card-img-wrap">
                  <img src={site.img} alt={site.name} className="heritage-card-img" />
                  <span className={`heritage-status-badge status--${site.statusType}`}>
                    {site.status}
                  </span>
                </div>
                <div className="heritage-card-content">
                  <h3 className="heritage-card-title">{site.name}</h3>
                  <p className="heritage-card-desc">{site.desc}</p>
                  <div className="heritage-card-footer">
                    <strong>Highlights:</strong>
                    <span>{site.highlights}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modern Status: Upcoming Industrial Hub (AURIC) */}
        <section className="history-section">
          <div className="history-box industrial-box">
            <div className="industrial-layout">
              <div className="industrial-text">
                <span className="hsec-pill industrial-pill">Modern Status &amp; Future</span>
                <h2>Upcoming Global Industrial &amp; Smart City Hub</h2>
                <p>
                  Beyond its historic grandeur, Chhatrapati Sambhajinagar is now recognized as Maharashtra’s premier engineering and automotive hub, anchored by <strong>AURIC (Aurangabad Industrial City)</strong> &mdash; India’s premier greenfield smart industrial city under the Delhi-Mumbai Industrial Corridor (DMIC).
                </p>
                <ul className="industrial-points">
                  <li>
                    <span className="ind-dot" />
                    <strong>Automotive &amp; EV Capital:</strong> Home to major manufacturing plants of Bajaj Auto, Skoda Auto Volkswagen India, and global Tier-1 auto-ancillaries.
                  </li>
                  <li>
                    <span className="ind-dot" />
                    <strong>Pharma &amp; Biotech Powerhouse:</strong> Massive formulation and bulk drug units of Lupin, Wockhardt, Ajanta Pharma, and Mylan.
                  </li>
                  <li>
                    <span className="ind-dot" />
                    <strong>AURIC Smart City (Shendra &amp; Bidkin):</strong> 10,000-acre smart city with 100% underground utilities, solar streetlights, 24/7 recycled water, and plug-and-play industrial plots.
                  </li>
                  <li>
                    <span className="ind-dot" />
                    <strong>Upcoming High-Speed Connectivity:</strong> Connected via Samruddhi Mahamarg Expressway, Vande Bharat Express, and proposed bullet train corridor.
                  </li>
                </ul>
              </div>
              <div className="industrial-image-wrap">
                <img
                  src="/assets/auric-industrial-city.jpg"
                  alt="AURIC Smart Industrial City Shendra Bidkin"
                  className="industrial-img"
                />
                <span className="industrial-caption">AURIC &mdash; Maharashtra’s 10,000-Acre Greenfield Smart Industrial City</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive District Map */}
        <section className="history-section">
          <div className="history-box">
            <div className="history-section-header">
              <span className="hsec-pill">Interactive Exploration</span>
              <h2>Interactive City &amp; District Map</h2>
              <p>Explore city wards, tourist monuments, industrial corridors, and key highway nodes.</p>
            </div>
            <div className="history-map-container">
              <iframe
                title="Chhatrapati Sambhajinagar Map"
                src="https://maps.google.com/maps?q=Chhatrapati+Sambhajinagar,+Maharashtra&t=&z=12&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="320"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
