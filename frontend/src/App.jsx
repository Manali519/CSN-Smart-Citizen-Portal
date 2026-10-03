import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import RequireCitizen from './components/RequireCitizen.jsx';
import UtilityTicker from './components/UtilityTicker.jsx';
import ContactUs from './components/ContactUs.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';

// Page stylesheets share classes (form fields, cards, modals, status pills), so they stay global and in
// their original cascade order. Only page code is split out below.
import './pages/CitizenRegister.css';
import './pages/CitizenLogin.css';
import './pages/OfficerLogin.css';
import './pages/Dashboard.css';
import './pages/KnowYourCity.css';
import './pages/CityHistory.css';
import './pages/CityTransportation.css';
import './pages/CityFacilities.css';
import './pages/DailyUpdates.css';
import './pages/WaterTankerBooking.css';
import './pages/GarbageVanBooking.css';
import './pages/RegisterComplaint.css';
import './pages/OfficerDashboard.css';
import './pages/ComplaintDashboard.css';
import './pages/PaymentTest.css';
import './pages/CityInsights.css';

// Pages load on demand so the first visit only downloads the home page.
const CitizenRegister = lazy(() => import('./pages/CitizenRegister.jsx'));
const CitizenLogin = lazy(() => import('./pages/CitizenLogin.jsx'));
const OfficerLogin = lazy(() => import('./pages/OfficerLogin.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const KnowYourCity = lazy(() => import('./pages/KnowYourCity.jsx'));
const CityHistory = lazy(() => import('./pages/CityHistory.jsx'));
const CityTransportation = lazy(() => import('./pages/CityTransportation.jsx'));
const CityFacilities = lazy(() => import('./pages/CityFacilities.jsx'));
const DailyUpdates = lazy(() => import('./pages/DailyUpdates.jsx'));
const WaterTankerBooking = lazy(() => import('./pages/WaterTankerBooking.jsx'));
const GarbageVanBooking = lazy(() => import('./pages/GarbageVanBooking.jsx'));
const RegisterComplaint = lazy(() => import('./pages/RegisterComplaint.jsx'));
const OfficerDashboard = lazy(() => import('./pages/OfficerDashboard.jsx'));
const ComplaintDashboard = lazy(() => import('./pages/ComplaintDashboard.jsx'));
const PaymentTest = lazy(() => import('./pages/PaymentTest.jsx'));
const LiveHeatmap = lazy(() => import('./pages/CityInsights.jsx').then((m) => ({ default: m.LiveHeatmap })));
const CityAnalytics = lazy(() => import('./pages/CityInsights.jsx').then((m) => ({ default: m.CityAnalytics })));

const STAFF_ROUTES = [
  { path: '/officer-dashboard', element: <OfficerDashboard /> },
  { path: '/officer/dashboard', element: <OfficerDashboard /> },
  { path: '/officer/complaints', element: <ComplaintDashboard role="officer" /> },
  { path: '/admin/complaints', element: <ComplaintDashboard role="admin" /> },
];

// Citizen services: visitors are sent to login first and brought back afterwards.
const CITIZEN_ROUTES = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/register-complaint', element: <RegisterComplaint /> },
  { path: '/complaints/register', element: <RegisterComplaint /> },
  { path: '/services/water-tanker', element: <WaterTankerBooking /> },
  { path: '/water-request', element: <WaterTankerBooking /> },
  { path: '/services/tanker', element: <WaterTankerBooking /> },
  { path: '/services/garbage-van', element: <GarbageVanBooking /> },
  { path: '/garbage-booking', element: <GarbageVanBooking /> },
  { path: '/payments/test', element: <PaymentTest /> },
];

const PUBLIC_ROUTES = [
  { path: '/', element: <Home /> },
  { path: '/citizen-register', element: <CitizenRegister /> },
  { path: '/citizen-login', element: <CitizenLogin /> },
  { path: '/officer-login', element: <OfficerLogin /> },
  { path: '/admin-login', element: <AdminLogin /> },
  { path: '/know-your-city', element: <KnowYourCity /> },
  { path: '/city-history', element: <CityHistory /> },
  { path: '/know-your-city/history', element: <CityHistory /> },
  { path: '/city-transport', element: <CityTransportation /> },
  { path: '/know-your-city/transportation', element: <CityTransportation /> },
  { path: '/city-facilities', element: <CityFacilities /> },
  { path: '/know-your-city/facilities', element: <CityFacilities /> },
  { path: '/daily-updates', element: <DailyUpdates /> },
  // Citizen reference pages, open without login
  { path: '/live-heatmap', element: <LiveHeatmap /> },
  { path: '/city-analytics', element: <CityAnalytics /> },
];

const STAFF_PATHS = new Set(STAFF_ROUTES.map((r) => r.path));

export default function App() {
  const { pathname } = useLocation();
  const isAdminLogin = pathname === '/admin-login';
  const isAdminPortal = pathname.startsWith('/admin/'); // has its own top bar
  const hideTicker = isAdminLogin || STAFF_PATHS.has(pathname);

  return (
    <div className="app-shell">
      <a href="#main-content" className="visually-hidden">Skip to main content</a>
      {!isAdminPortal && <Navbar minimal={isAdminLogin} />}
      {!hideTicker && <UtilityTicker />}

      <main id="main-content">
        <Suspense fallback={<p className="container section">Loading&hellip;</p>}>
          <Routes>
            {[...PUBLIC_ROUTES, ...STAFF_ROUTES].map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            {CITIZEN_ROUTES.map(({ path, element }) => (
              <Route key={path} path={path} element={<RequireCitizen>{element}</RequireCitizen>} />
            ))}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <ContactUs />
      <Footer />
    </div>
  );
}
