import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from './logo.png';
import './Navbar.css';

export default function Navbar({ minimal = false }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) setOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function close() {
    setOpen(false);
    setServicesOpen(false);
  }

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

  async function handleLogout() {
    close();
    await logout();
    navigate('/citizen-login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" onClick={goHome}>
          <img src={logo} alt="Smart City Logo" className="brand-logo" />
          <span className="brand-text">
            <strong>Chh. Sambhajinagar</strong>
            <small>Smart Citizen Portal</small>
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

            {/* Citizen-only actions: rendered for logged-in citizens (never in the minimal admin-login variant) */}
            {!minimal && isLoggedIn && (
              <>
                <li>
                  <NavLink
                    to="/register-complaint"
                    onClick={close}
                    className={({ isActive }) => `nav-complaint-btn ${isActive ? 'active' : ''}`}
                  >
                    📝 Register a Complaint
                  </NavLink>
                </li>
                <li className="nav-dropdown-item nav-services-dropdown">
                  <button
                    type="button"
                    className="nav-dropdown-btn nav-services-btn"
                    onClick={() => setServicesOpen((v) => !v)}
                  >
                    ⚡ Services <span className="nav-dropdown-arrow">▾</span>
                  </button>
                  <div className={`nav-dropdown-content ${servicesOpen ? 'force-open' : ''}`}>
                    <NavLink to="/services/water-tanker" onClick={close} className="nav-dropdown-link nav-service-item">
                      <span className="service-nav-icon">💧</span>
                      <div>
                        <strong>Water Tanker</strong>
                        <small>Book 1000L - 20000L online</small>
                      </div>
                    </NavLink>
                    <NavLink to="/services/garbage-van" onClick={close} className="nav-dropdown-link nav-service-item">
                      <span className="service-nav-icon">🚛</span>
                      <div>
                        <strong>Garbage Vans</strong>
                        <small>Civic waste pickup &amp; tracking</small>
                      </div>
                    </NavLink>
                  </div>
                </li>
              </>
            )}
          </ul>

          {!minimal && (
            <div className="nav-auth">
              {isLoggedIn ? (
                <div className="nav-user-cluster">
                  <NavLink to="/dashboard" className="btn nav-btn-user" onClick={close}>
                    <span className="user-avatar-circle">
                      {(user?.firstName || 'C')[0].toUpperCase()}
                    </span>
                    <span>{user?.firstName ? `${user.firstName}` : 'Dashboard'}</span>
                  </NavLink>
                  <button type="button" className="btn nav-btn-logout" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              ) : (
                <>
                  <NavLink to="/citizen-login" className="btn nav-btn-login" onClick={close}>
                    Citizen Login
                  </NavLink>
                  <NavLink to="/officer-login" className="btn nav-btn-officer" onClick={close}>
                    Officer Login
                  </NavLink>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
