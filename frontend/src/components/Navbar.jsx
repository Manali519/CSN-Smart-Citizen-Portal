import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from './logo.png';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) setOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function close() { setOpen(false); }

  function goHome() {
    close();
    navigate('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  function scrollTo(id) {
    close();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el2 = document.getElementById(id);
        if (el2) el2.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" onClick={goHome}>
          <img src={logo} alt="Smart City Logo" className="brand-logo" />
          <span className="brand-text">
            <strong>Chh. Sambhajinagar</strong>
            <small>Smart City Portal</small>
          </span>
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav
          id="primary-navigation"
          className={`nav-links ${open ? 'is-open' : ''}`}
          aria-label="Primary"
        >
          <ul>
            <li>
              <button type="button" className="nav-anchor-btn" onClick={goHome}>
                Home
              </button>
            </li>
            <li>
              <button type="button" className="nav-anchor-btn" onClick={() => scrollTo('how-it-works')}>
                How It Works
              </button>
            </li>
            <li>
              <button type="button" className="nav-anchor-btn" onClick={() => scrollTo('about')}>
                About Us
              </button>
            </li>
            <li className="nav-dropdown-item">
              <NavLink
                to="/know-your-city"
                onClick={close}
                className={({ isActive }) => `nav-dropdown-btn ${isActive ? 'active' : ''}`}
              >
                Know Your City <span className="nav-dropdown-arrow">▾</span>
              </NavLink>
              <div className="nav-dropdown-content">
                <NavLink to="/city-history" onClick={close} className="nav-dropdown-link">
                  🏛️ History &amp; Heritage
                </NavLink>
                <NavLink to="/city-transport" onClick={close} className="nav-dropdown-link">
                  🚆 Transportation
                </NavLink>
                <NavLink to="/city-facilities" onClick={close} className="nav-dropdown-link">
                  🏢 City Facilities
                </NavLink>
              </div>
            </li>
          </ul>

          <div className="nav-auth">
            <NavLink to="/citizen-login" className="btn nav-btn-login" onClick={close}>
              Citizen Login
            </NavLink>
            <NavLink to="/officer-login" className="btn nav-btn-officer" onClick={close}>
              Officer Login
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
