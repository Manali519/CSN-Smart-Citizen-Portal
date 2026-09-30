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
import WaterTankerBooking from './pages/WaterTankerBooking.jsx';
import TankerLiveTracking from './pages/TankerLiveTracking.jsx';
import GarbageVanBooking from './pages/GarbageVanBooking.jsx';
import RegisterComplaint from './pages/RegisterComplaint.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

const ROUTE_ALIASES = [
  { path: '/officer-dashboard', element: <OfficerDashboard /> },
  { path: '/officer/dashboard', element: <OfficerDashboard /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/register-complaint', element: <RegisterComplaint /> },
  { path: '/complaints/register', element: <RegisterComplaint /> },
  { path: '/services/water-tanker', element: <WaterTankerBooking /> },
  { path: '/water-request', element: <WaterTankerBooking /> },
  { path: '/services/tanker', element: <WaterTankerBooking /> },
  { path: '/track-tanker/:bookingId', element: <TankerLiveTracking /> },
  { path: '/services/garbage-van', element: <GarbageVanBooking /> },
  { path: '/garbage-booking', element: <GarbageVanBooking /> },
  { path: '/know-your-city', element: <KnowYourCity /> },
  { path: '/city-history', element: <CityHistory /> },
  { path: '/know-your-city/history', element: <CityHistory /> },
  { path: '/city-transport', element: <CityTransportation /> },
  { path: '/know-your-city/transportation', element: <CityTransportation /> },
  { path: '/city-facilities', element: <CityFacilities /> },
  { path: '/know-your-city/facilities', element: <CityFacilities /> },
  { path: '/daily-updates', element: <DailyUpdates /> },
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

          {ROUTE_ALIASES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </main>

      <ContactUs />
      <Footer />
    </div>
  );
}
