import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CityFacilities.css';

const FACILITIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
      </svg>
    ),
    title: 'Public Gardens & Parks',
    count: '22+',
    desc: 'Public recreational parks and botanical gardens maintained by the Garden Dept.',
    keySpots: 'Siddharth Garden & Zoo, Himayat Bagh, Salim Ali Lake Bird Sanctuary, VIP Garden CIDCO',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="10" width="18" height="11" rx="1.5" />
        <path d="M7 10V7a5 5 0 0 1 10 0v3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Hospitals & Dispensaries',
    count: '14',
    desc: 'Government medical college, civil hospital, and ward primary health centers.',
    keySpots: 'GMCH (Ghati Hospital), District Civil Hospital, Cantonment Hospital, 11 Municipal Clinics',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3l9 9H3l9-9z" strokeLinejoin="round" />
        <rect x="7" y="12" width="4" height="9" rx="0.5" />
        <rect x="13" y="15" width="4" height="6" rx="0.5" />
      </svg>
    ),
    title: 'Municipal Schools',
    count: '180+',
    desc: 'CSMC managed Marathi, Urdu, and English medium primary & secondary schools.',
    keySpots: 'Paithan Gate Central School, CIDCO N-7 High School, Begumpura Primary School, Harsul High School',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Fire & Emergency Stations',
    count: '6',
    desc: '24/7 Rapid response fire brigade posts equipped with hydraulic ladders and tenders.',
    keySpots: 'Padampura Central Fire Station, CIDCO N-5 Post, Chikalthana MIDC Post, Waluj Station',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" strokeLinejoin="round" />
        <path d="M12 14v-4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Water Filtration Plants',
    count: '8',
    desc: 'High capacity water treatment plants & master balancing reservoirs.',
    keySpots: 'Nakshatrawadi WTP (Jayakwadi pipeline), Harsul Lake Filtration Plant, Pharanbaug ESR',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="7" height="8" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" />
      </svg>
    ),
    title: 'Zonal Administration Offices',
    count: '10',
    desc: 'Decentralised civic centres for property tax, birth/death records, and certificates.',
    keySpots: 'Town hall , Cidco N6 , Central Naka , Krantichowk , Jawahar Colony and more ',
  },
];

export default function CityFacilities() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="facilities-page">
      {/* Hero Header */}
      <section className="facilities-hero">
        <div className="container">
          <div className="facilities-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/know-your-city">Know Your City</Link>
            <span>/</span>
            <span>City Facilities</span>
          </div>
          <span className="facilities-tag">Civic Infrastructure</span>
          <h1>City Facilities &amp; Public Amenities</h1>
          <p className="facilities-subtitle">
            Explore key public infrastructure maintained by the Chhatrapati Sambhajinagar Municipal Corporation across all 10 zones.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container facilities-container">
        <div className="facilities-grid">
          {FACILITIES.map((f) => (
            <div className="facility-card" key={f.title}>
              <div className="facility-card-top">
                <div className="facility-icon-box">{f.icon}</div>
                <div className="facility-count-badge">{f.count}</div>
              </div>
              <h2 className="facility-card-title">{f.title}</h2>
              <p className="facility-card-desc">{f.desc}</p>
              <div className="facility-card-spots">
                <strong>Key Locations:</strong>
                <p>{f.keySpots}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
