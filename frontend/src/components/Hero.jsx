import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-content container">
        {/* Left: text content */}
        <div className="hero-text">
          <p className="hero-eyebrow">Chhatrapati Sambhajinagar Municipal Corporation</p>
          <h1 id="hero-heading">A platfrom for everything you need , in one place!</h1>
          <p className="hero-sub">
            Report a problem, follow its progress, check daily updates for your ward,
            request a water tanker or garbage van, and reach the right officer
            without standing in a queue.
          </p>
          <div className="hero-actions">
            <Link to="/register-complaint" className="btn btn-on-white">
              Register a Complaint
            </Link>
            <Link to="/track-complaint" className="btn btn-outline-on-orange">
              Track Your Complaint
            </Link>
          </div>
        </div>

        {/* Right: city photo */}
        <div className="hero-image-wrap">
          <img
            src="/assets/csn-welcome.jpg"
            alt="Chhatrapati Sambhajinagar city skyline at sunset"
            className="hero-city-img"
          />
        </div>
      </div>
    </section>
  );
}
