import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import UtilityTicker from './components/UtilityTicker.jsx';
import ContactUs from './components/ContactUs.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CitizenRegister from './pages/CitizenRegister.jsx';
import CitizenLogin from './pages/CitizenLogin.jsx';
import OfficerLogin from './pages/OfficerLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import KnowYourCity from './pages/KnowYourCity.jsx';
import CityHistory from './pages/CityHistory.jsx';
import CityTransportation from './pages/CityTransportation.jsx';
import CityFacilities from './pages/CityFacilities.jsx';
import DailyUpdates from './pages/DailyUpdates.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

const PLACEHOLDER_ROUTES = [
  { path: '/register-complaint', title: 'Register a Complaint' },
  { path: '/track-complaint', title: 'Track Your Complaint' },
  { path: '/water-request', title: 'Water Request' },
  { path: '/live-heatmap', title: 'Live Heatmap' },
];

export default function App() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="visually-hidden">Skip to main content</a>
      <Navbar />
      <UtilityTicker />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/citizen-register" element={<CitizenRegister />} />
          <Route path="/citizen-login" element={<CitizenLogin />} />
          <Route path="/officer-login" element={<OfficerLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Know Your City & Subpages */}
          <Route path="/know-your-city" element={<KnowYourCity />} />
          <Route path="/city-history" element={<CityHistory />} />
          <Route path="/know-your-city/history" element={<CityHistory />} />
          <Route path="/city-transport" element={<CityTransportation />} />
          <Route path="/know-your-city/transportation" element={<CityTransportation />} />
          <Route path="/city-facilities" element={<CityFacilities />} />
          <Route path="/know-your-city/facilities" element={<CityFacilities />} />
  

          {/* Daily Updates */}
          <Route path="/daily-updates" element={<DailyUpdates />} />

          {PLACEHOLDER_ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<ComingSoon title={r.title} />} />
          ))}
          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </main>

      <ContactUs />
      <Footer />
    </div>
  );
}
